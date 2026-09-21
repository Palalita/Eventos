// Cliente de Prisma (el ORM que habla con la base de datos Postgres en Neon).
// Cualquier archivo que necesite leer/escribir en la BD importa `db` desde
// aquí (`import { db } from "@/lib/db"`) en vez de crear su propio
// PrismaClient — así todo el proyecto comparte una sola conexión.
import { PrismaClient } from "@prisma/client";

// En desarrollo, Next.js recarga los módulos del servidor en cada cambio de
// archivo (hot reload). Si cada recarga creara un PrismaClient nuevo,
// abriríamos una conexión a la BD por cada guardado hasta agotar el pool.
// Guardamos la instancia en `globalThis` (que sobrevive a los reloads) y la
// reutilizamos si ya existe.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
