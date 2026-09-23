// Server Actions de autenticación: signup, login, logout y la confirmación
// de dispositivo. Una "Server Action" (la directiva "use server" de arriba)
// es una función que vive en el servidor pero un componente de cliente puede
// llamar como si fuera una función normal — Next.js genera por detrás una
// petición HTTP (un POST) hacia esta función.
//
// Quién las llama:
// - signup ← app/registro/SignupForm.tsx (vía useActionState)
// - login ← app/login/LoginForm.tsx (vía useActionState)
// - logout ← el botón de cerrar sesión en app/page.tsx
// - confirmDeviceVerification ← el <form action={...}> de app/verificar-dispositivo/page.tsx
"use server";

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { User } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  deleteSession,
  createPendingLoginCookie,
  getPendingLogin,
  deletePendingLoginCookie,
} from "@/lib/session";
import { getOrCreateDeviceToken, hashToken, setDeviceCookie } from "@/lib/device";
import { sendDeviceVerificationEmail } from "@/lib/email";
import { getEventSettings } from "@/lib/settings";
import { isValidTheme } from "@/lib/themes";
import { isValidFont } from "@/lib/fonts";
import {
  LoginFormSchema,
  LoginFormState,
  SignupFormSchema,
  SignupFormState,
} from "@/lib/definitions";

const DEVICE_VERIFICATION_MINUTES = 15;

// Crea la cuenta de un invitado. Requiere un código de invitación válido
// (creado antes por un admin en app/actions/invitations.ts) que coincida con
// el correo al que se le mandó.
export async function signup(_state: SignupFormState, formData: FormData) {
  // Zod valida forma y tamaño mínimo de cada campo; si falla, se devuelven
  // los errores por campo y SignupForm.tsx los muestra sin recargar la página.
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    code: formData.get("code"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password, code } = validatedFields.data;

  // El código tiene que existir, seguir sin usarse (PENDING) y ser el que se
  // mandó justo a este correo — así una persona no puede registrarse con el
  // código de otra.
  const invitation = await db.invitation.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (
    !invitation ||
    invitation.status !== "PENDING" ||
    invitation.email.toLowerCase() !== email.toLowerCase()
  ) {
    return {
      message: "Ese código no es válido para este correo. Revisa el correo de invitación.",
    };
  }

  // Escopado a ESTA organización (no a toda la plataforma): la misma
  // persona puede ya tener una cuenta en otro evento con este correo — eso
  // es válido, ver prisma/schema.prisma#User. Lo único que no se permite es
  // una segunda cuenta para el mismo correo dentro del mismo evento.
  const existing = await db.user.findFirst({
    where: { email, organizationId: invitation.organizationId },
  });
  if (existing) {
    return { message: "Ya tenés una cuenta con ese correo en este evento." };
  }

  // bcrypt.hash hashea la contraseña (nunca se guarda en texto plano); el
  // "10" es el costo del hash (más alto = más lento de calcular = más
  // resistente a fuerza bruta si la BD se filtra).
  const passwordHash = await bcrypt.hash(password, 10);

  // El invitado hereda la organización de la invitación que usó — el código
  // (único a nivel de toda la plataforma) es lo que resuelve a qué cliente
  // pertenece, sin depender de la URL desde la que se registró.
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "GUEST",
      organizationId: invitation.organizationId,
    },
  });

  // Se marca el código como usado para que nadie más pueda registrarse con él.
  await db.invitation.update({
    where: { id: invitation.id },
    data: { status: "USED", usedAt: new Date() },
  });

  await createSession({ userId: user.id, role: user.role, organizationId: user.organizationId });
  redirect("/panel");
}

// Compartida entre login() (cuando el correo+contraseña resuelve a una sola
// cuenta) y chooseLoginAccount() (cuando la persona eligió una entre varias):
// pide verificación de dispositivo si hace falta, o abre la sesión directo.
async function finishLogin(user: User): Promise<LoginFormState> {
  if (user.role === "ADMIN") {
    const deviceToken = await getOrCreateDeviceToken();
    const trusted = await db.trustedDevice.findUnique({
      where: { tokenHash: hashToken(deviceToken) },
    });

    if (!trusted || trusted.userId !== user.id) {
      // Dispositivo nuevo: se crea un token de un solo uso (expira en 15
      // minutos) y se manda por correo en vez de loguear directo.
      const verificationToken = randomUUID();
      await db.deviceVerification.create({
        data: {
          userId: user.id,
          // No-null assertion segura: este bloque solo corre para
          // role === "ADMIN", que el CHECK constraint de la BD garantiza
          // que siempre tiene organización.
          organizationId: user.organizationId!,
          tokenHash: hashToken(verificationToken),
          deviceToken,
          expiresAt: new Date(Date.now() + DEVICE_VERIFICATION_MINUTES * 60 * 1000),
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
      await sendDeviceVerificationEmail(
        user.email,
        `${baseUrl}/verificar-dispositivo?token=${verificationToken}`
      );

      // Guardamos el device_id ahora: si el correo se abre en este mismo
      // navegador, al confirmarlo quedará marcado como confiable.
      await setDeviceCookie(deviceToken);

      // LoginForm.tsx detecta este flag y muestra "revisá tu correo" en vez
      // de intentar redirigir (todavía no hay sesión creada).
      return { pendingDeviceVerification: true };
    }

    // Dispositivo ya confiable: solo se actualiza la fecha de último uso.
    await db.trustedDevice.update({
      where: { id: trusted.id },
      data: { lastSeenAt: new Date() },
    });
  }

  await createSession({ userId: user.id, role: user.role, organizationId: user.organizationId });
  redirect("/panel");
}

// Valida email + contraseña. Si el usuario es ADMIN y el navegador no es uno
// ya confiable, en vez de loguear manda un correo de verificación y corta
// acá (ver confirmDeviceVerification más abajo, que es la que realmente abre
// la sesión en ese caso).
export async function login(_state: LoginFormState, formData: FormData) {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;

  // El correo ya no identifica una sola cuenta (puede haber una por
  // organización — ver prisma/schema.prisma#User), así que se prueba la
  // contraseña contra CADA cuenta que comparta este correo (no se corta en
  // la primera que coincide, a propósito: hace falta saber si hay más de
  // una para poder ofrecer el selector más abajo). MASTER nunca entra por
  // acá (por diseño solo por /master, ver masterLogin()), pero sí se le
  // corre el mismo bcrypt.compare — si no, un correo que solo tiene cuenta
  // master respondería más rápido que uno con una cuenta real, y ese tiempo
  // de respuesta delataría que existen cuentas master.
  const candidates = await db.user.findMany({ where: { email } });
  const matches: User[] = [];
  for (const candidate of candidates) {
    const passwordMatches = await bcrypt.compare(password, candidate.passwordHash);
    if (passwordMatches && candidate.role !== "MASTER") {
      matches.push(candidate);
    }
  }

  if (matches.length === 0) {
    // Mensaje genérico a propósito: no decimos "el correo no existe" para no
    // ayudar a alguien a adivinar qué correos están registrados.
    return { message: "Correo o contraseña incorrectos." };
  }

  if (matches.length > 1) {
    // Ya se verificó la contraseña contra cada una de estas cuentas acá
    // arriba — la cookie solo recuerda CUÁLES para que chooseLoginAccount()
    // no tenga que pedirla de nuevo (y nunca la guarda a ella misma).
    await createPendingLoginCookie({ userIds: matches.map((m) => m.id) });
    const multipleAccounts = await Promise.all(
      matches.map(async (m) => {
        const organization = await db.organization.findUnique({
          where: { id: m.organizationId! },
          select: { name: true },
        });
        return {
          userId: m.id,
          organizationName: organization?.name ?? "Evento",
          role: m.role as "ADMIN" | "GUEST",
        };
      })
    );
    return { multipleAccounts };
  }

  return finishLogin(matches[0]);
}

// Dispara desde el selector "¿A cuál evento querés entrar?" que LoginForm.tsx
// muestra cuando login() encuentra más de una cuenta — un <form> simple por
// cuenta, sin useActionState (como resendInvitation/revokeTrustedDevice).
// No vuelve a pedir la contraseña: confía en la cookie de
// createPendingLoginCookie(), que ya demostró que ESTE navegador la escribió
// bien para el id elegido (y para ningún otro) hace menos de 5 minutos.
export async function chooseLoginAccount(formData: FormData) {
  const userId = formData.get("userId");
  const pending = await getPendingLogin();
  if (typeof userId !== "string" || !pending || !pending.userIds.includes(userId)) {
    redirect("/login?device=invalido");
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    redirect("/login?device=invalido");
  }

  // Un solo uso: no queremos que este mismo enlace/cookie sirva para volver
  // a elegir cuenta después de ya haber entrado a una.
  await deletePendingLoginCookie();

  const result = await finishLogin(user);
  // finishLogin() ya redirige a /panel en el caso normal; solo vuelve acá
  // cuando hace falta verificación de dispositivo (ADMIN, navegador nuevo).
  // Esta Server Action no usa useActionState (es un <form> suelto), así que
  // no hay dónde mostrar ese `result` — se manda por query param, mismo
  // patrón que ?device=expirado/invalido, y LoginForm.tsx lo interpreta.
  if (result?.pendingDeviceVerification) {
    redirect("/login?device=pendiente");
  }
}

// Resuelve el tema/tipografía/lema del evento del invitado (o admin) dueño
// de ese correo, para que LoginForm.tsx pinte /login con la identidad de
// ESA organización antes de iniciar sesión — igual que /registro ya hace
// con el código de invitación, pero acá la única pista disponible antes de
// loguear es el correo. No es un formulario: es solo un lookup de
// apariencia que LoginForm llama al perder foco el campo de correo, así
// que a propósito no distingue "no existe esa cuenta" de "existe pero sin
// organización" (MASTER, por ejemplo) — ambos casos devuelven null y la
// página se queda con la identidad genérica de la plataforma. Mismo
// criterio si el correo tiene cuentas en MÁS DE UNA organización (ahora
// posible — ver prisma/schema.prisma#User): no hay forma de adivinar a
// cuál se está por loguear antes de la contraseña, así que mejor quedarse
// con la identidad genérica que mostrar el tema equivocado. Ojo: esto sí
// revela por un canal lateral (el cambio de color) si un correo tiene
// cuenta registrada, igual que el patrón "branding por correo" que ya usan
// productos como Slack u Okta en su pantalla de login — se acepta ese
// costo a cambio de que el invitado vea el sitio de su evento sin
// depender de en qué dispositivo se registró.
export async function getOrgBrandingForEmail(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return null;

  const candidates = await db.user.findMany({
    where: { email: trimmed },
    select: { organizationId: true },
  });
  const orgIds = [
    ...new Set(candidates.map((c) => c.organizationId).filter((id): id is string => id !== null)),
  ];
  if (orgIds.length !== 1) return null;

  const organization = await db.organization.findUnique({
    where: { id: orgIds[0] },
    select: { theme: true, font: true },
  });
  if (!organization) return null;

  const settings = await getEventSettings(orgIds[0]);

  return {
    theme: isValidTheme(organization.theme) ? organization.theme : null,
    font: isValidFont(organization.font) ? organization.font : null,
    lema: settings.lema || null,
  };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

// Confirma el dispositivo y abre la sesión. A propósito solo se dispara con
// un POST explícito del botón en /verificar-dispositivo (no en el GET que
// abre esa página): un GET puede visitarse solo -prefetch del navegador,
// escáneres de seguridad de correo-, y eso quemaría el token o abriría la
// sesión sin que el admin haga nada.
//
// No requiere sesión previa (es justamente la acción que la crea): la
// autorización acá es "conocer el token", que es aleatorio, de un solo uso
// y expira en 15 minutos — el mismo modelo de seguridad que un link de
// "restablecer contraseña".
export async function confirmDeviceVerification(formData: FormData) {
  const token = formData.get("token");
  if (typeof token !== "string" || !token) {
    redirect("/login?device=invalido");
  }

  const verification = await db.deviceVerification.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!verification || verification.expiresAt < new Date()) {
    redirect("/login?device=expirado");
  }

  const user = await db.user.findUnique({ where: { id: verification.userId } });
  if (!user) {
    redirect("/login?device=invalido");
  }

  // upsert: si por algún motivo ese dispositivo ya estaba guardado, solo
  // actualiza "último uso"; si no, lo crea como confiable.
  await db.trustedDevice.upsert({
    where: { tokenHash: hashToken(verification.deviceToken) },
    update: { lastSeenAt: new Date() },
    create: {
      userId: user.id,
      // Solo un ADMIN llega hasta acá (es el único rol que dispara
      // verificación de dispositivo en login()), así que siempre tiene
      // organización.
      organizationId: user.organizationId!,
      tokenHash: hashToken(verification.deviceToken),
      label: "Confirmado por correo",
    },
  });
  // Se borra el token de verificación: no se puede volver a usar el mismo
  // link (protege contra que alguien lo reenvíe o lo reutilice después).
  await db.deviceVerification.delete({ where: { id: verification.id } });

  await setDeviceCookie(verification.deviceToken);
  await createSession({ userId: user.id, role: user.role, organizationId: user.organizationId });

  redirect("/panel");
}
