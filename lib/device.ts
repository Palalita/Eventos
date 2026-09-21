// Maneja el "device_id": una cookie de larga duración que identifica al
// navegador (no al usuario). Se usa para la verificación de dispositivo de
// admin: la primera vez que un admin loguea desde un navegador nuevo, se le
// manda un correo de confirmación (ver app/actions/auth.ts y
// app/verificar-dispositivo/page.tsx); una vez confirmado, ese device_id
// queda guardado (hasheado) en la tabla TrustedDevice y los siguientes
// logins desde ese mismo navegador no vuelven a pedir el correo.
import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";

export const DEVICE_COOKIE = "device_id";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

// Nunca guardamos el device_id ni los tokens de verificación en texto plano
// en la BD: se guarda el hash, así una fuga de la base no permite
// suplantar dispositivos ya confiables.
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Lee el device_id del navegador actual; si no existe, genera uno (sin
// guardarlo todavía como confiable — eso solo pasa tras verificar por correo).
export async function getOrCreateDeviceToken() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(DEVICE_COOKIE)?.value;
  if (existing) return existing;
  return randomUUID();
}

export async function setDeviceCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(DEVICE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE,
  });
}
