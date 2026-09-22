// Route Handler (no una página): responde a GET /api/fotos/[id]. Es la URL
// que usa <img>/<video> en app/MediaPreview.tsx en vez del fileUrl de Blob
// directo — así se puede chequear permisos antes de mostrar la imagen real.
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
    // organizationId también, no solo el rol: sin este chequeo, un admin de
    // OTRA organización podía ver fotos pendientes/rechazadas de un cliente
    // ajeno con solo adivinar el id.
    const isAdmin = session?.role === "ADMIN" && session.organizationId === photo.organizationId;
    if (!isOwner && !isAdmin) {
      return new Response("No autorizado", { status: 403 });
    }
  }

  // Ya autorizado: se redirige al navegador directo a la URL real de Blob
  // (así no cargamos nosotros el peso de la imagen, solo la puerta de acceso).
  return NextResponse.redirect(photo.fileUrl);
}
