"use server";

import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { getOrCreateDeviceToken, hashToken, setDeviceCookie } from "@/lib/device";
import { sendDeviceVerificationEmail } from "@/lib/email";
import {
  LoginFormSchema,
  LoginFormState,
  SignupFormSchema,
  SignupFormState,
} from "@/lib/definitions";

const DEVICE_VERIFICATION_MINUTES = 15;

export async function signup(_state: SignupFormState, formData: FormData) {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { message: "Ya existe una cuenta con ese correo." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: { name, email, passwordHash, role: "GUEST" },
  });

  await createSession({ userId: user.id, role: user.role });
  redirect("/");
}

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
    return { message: "Correo o contraseña incorrectos." };
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { message: "Correo o contraseña incorrectos." };
  }

  if (user.role === "ADMIN") {
    const deviceToken = await getOrCreateDeviceToken();
    const trusted = await db.trustedDevice.findUnique({
      where: { tokenHash: hashToken(deviceToken) },
    });

    if (!trusted || trusted.userId !== user.id) {
      const verificationToken = randomUUID();
      await db.deviceVerification.create({
        data: {
          userId: user.id,
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

      return { pendingDeviceVerification: true };
    }

    await db.trustedDevice.update({
      where: { id: trusted.id },
      data: { lastSeenAt: new Date() },
    });
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
