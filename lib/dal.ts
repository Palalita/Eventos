import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }
  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      qrToken: true,
      attended: true,
      checkedInAt: true,
    },
  });
  return user;
});

export async function requireAdmin() {
  const session = await verifySession();
  if (session.role !== "ADMIN") {
    redirect("/panel");
  }
  return session;
}

export async function requireGuest() {
  const session = await verifySession();
  if (session.role !== "GUEST") {
    redirect("/admin");
  }
  return session;
}
