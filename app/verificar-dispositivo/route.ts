import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { hashToken, setDeviceCookie } from "@/lib/device";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?device=invalido", request.url));
  }

  const verification = await db.deviceVerification.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!verification || verification.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?device=expirado", request.url));
  }

  const user = await db.user.findUnique({ where: { id: verification.userId } });
  if (!user) {
    return NextResponse.redirect(new URL("/login?device=invalido", request.url));
  }

  await db.trustedDevice.upsert({
    where: { tokenHash: hashToken(verification.deviceToken) },
    update: { lastSeenAt: new Date() },
    create: {
      userId: user.id,
      tokenHash: hashToken(verification.deviceToken),
      label: "Confirmado por correo",
    },
  });
  await db.deviceVerification.delete({ where: { id: verification.id } });

  await setDeviceCookie(verification.deviceToken);
  await createSession({ userId: user.id, role: user.role });

  return NextResponse.redirect(new URL("/", request.url));
}
