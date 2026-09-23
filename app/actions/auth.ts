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
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
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

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { message: "Ya existe una cuenta con ese correo." };
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

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Mensaje genérico a propósito: no decimos "el correo no existe" para no
    // ayudar a alguien a adivinar qué correos están registrados.
    return { message: "Correo o contraseña incorrectos." };
  }

  // Siempre se corre el bcrypt.compare, incluso para MASTER, antes de
  // rechazarlo por rol: si el chequeo de rol cortara primero, una cuenta
  // master respondería más rápido que una normal (sin el costo de bcrypt),
  // y ese tiempo de respuesta delataría qué correos son cuentas master.
  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { message: "Correo o contraseña incorrectos." };
  }

  // MASTER nunca puede loguear desde este formulario público, ni con la
  // contraseña correcta: por diseño solo entra por /master (ver
  // masterLogin() en este mismo archivo). Mismo mensaje genérico, para no
  // revelar que existen cuentas master.
  if (user.role === "MASTER") {
    return { message: "Correo o contraseña incorrectos." };
  }

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

// Resuelve el tema/tipografía/lema del evento del invitado (o admin) dueño
// de ese correo, para que LoginForm.tsx pinte /login con la identidad de
// ESA organización antes de iniciar sesión — igual que /registro ya hace
// con el código de invitación, pero acá la única pista disponible antes de
// loguear es el correo. No es un formulario: es solo un lookup de
// apariencia que LoginForm llama al perder foco el campo de correo, así
// que a propósito no distingue "no existe esa cuenta" de "existe pero sin
// organización" (MASTER, por ejemplo) — ambos casos devuelven null y la
// página se queda con la identidad genérica de la plataforma. Ojo: esto sí
// revela por un canal lateral (el cambio de color) si un correo tiene
// cuenta registrada, igual que el patrón "branding por correo" que ya usan
// productos como Slack u Okta en su pantalla de login — se acepta ese
// costo a cambio de que el invitado vea el sitio de su evento sin
// depender de en qué dispositivo se registró.
export async function getOrgBrandingForEmail(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return null;

  const user = await db.user.findUnique({
    where: { email: trimmed },
    select: { organizationId: true },
  });
  if (!user?.organizationId) return null;

  const organization = await db.organization.findUnique({
    where: { id: user.organizationId },
    select: { theme: true, font: true },
  });
  if (!organization) return null;

  const settings = await getEventSettings(user.organizationId);

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
