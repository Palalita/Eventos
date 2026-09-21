// Maneja la "sesión" del usuario logueado: la guarda firmada (JWT) en una
// cookie httpOnly llamada "session", para que ni JavaScript del navegador ni
// un atacante puedan leerla o falsificarla sin conocer SESSION_SECRET.
//
// Quién usa esto:
// - `app/actions/auth.ts` llama a createSession() al hacer login/registro/
//   confirmar dispositivo, y deleteSession() al hacer logout.
// - `lib/dal.ts` (verifySession/requireAdmin) llama a getSession() en cada
//   página protegida para saber quién sos.
import "server-only"; // este archivo nunca se debe poder importar desde un componente de cliente
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Lo que va firmado adentro de la cookie: solo el id de usuario y su rol.
// (No hay contraseña ni datos sensibles acá, solo lo mínimo para identificarlo.)
export type SessionPayload = {
  userId: string;
  role: "ADMIN" | "GUEST";
};

// La app no arranca si falta esta variable de entorno: sin ella no hay forma
// segura de firmar/verificar sesiones.
const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("Falta la variable de entorno SESSION_SECRET");
}
const encodedKey = new TextEncoder().encode(secretKey);

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // la sesión dura 7 días

// Convierte el payload (userId + role) en un JWT firmado con HS256.
export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

// Verifica la firma del JWT guardado en la cookie y devuelve su contenido.
// Si la cookie no existe, expiró o fue manipulada, devuelve null en vez de
// tirar una excepción (así el caller solo tiene que chequear "hay sesión o no").
export async function decrypt(
  session: string | undefined
): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// Crea el JWT y lo guarda en una cookie httpOnly (invisible para JS del
// navegador) y `secure` en producción (solo viaja por HTTPS).
export async function createSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await encrypt(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// Lee y decodifica la cookie de sesión de la petición actual.
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  return decrypt(cookie);
}

// Logout: simplemente borra la cookie (no hay una tabla de sesiones en la
// BD que "revocar" — el JWT deja de mandarse y ya).
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
