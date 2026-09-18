import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// El store de Blob es público (no permite mezclar público/privado), así que
// la privacidad de las fotos pendientes/rechazadas la controla esta ruta:
// nunca exponemos `fileUrl` al navegador hasta comprobar que quien pide la
// foto es su dueño o un admin.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const photo = await db.photoRequest.findUnique({ where: { id } });
  if (!photo) {
    return new Response("No encontrada", { status: 404 });
  }

  if (photo.status !== "APPROVED") {
    const session = await getSession();
    const isOwner = session?.userId === photo.userId;
    const isAdmin = session?.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return new Response("No autorizado", { status: 403 });
    }
  }

  return NextResponse.redirect(photo.fileUrl);
}
