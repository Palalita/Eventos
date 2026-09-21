// Route Handler que genera al vuelo (no se guarda en ningún lado) la imagen
// PNG del código QR de un invitado. La usa el <Image src={`/api/qr/${token}`}>
// de app/invitacion/[token]/page.tsx.
import QRCode from "qrcode";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const user = await db.user.findUnique({ where: { qrToken: token } });
  if (!user) {
    return new Response("No encontrado", { status: 404 });
  }

  // Solo el dueño del QR o un admin pueden verlo — evita que cualquiera con
  // el link de la invitación de otro pueda descargarse (y reusar) su QR.
  const session = await getSession();
  const isOwner = session?.userId === user.id;
  const isAdmin = session?.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return new Response("No autorizado", { status: 403 });
  }

  // El QR codifica la URL pública de la invitación del usuario; al
  // escanearlo (con QrScanner.tsx en el check-in) se llega a esa misma página.
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const invitationUrl = `${baseUrl}/invitacion/${token}`;

  const pngBuffer = await QRCode.toBuffer(invitationUrl, {
    type: "png",
    width: 320,
    margin: 2,
    color: { dark: "#7a1f4b", light: "#fff8f5" },
  });

  return new Response(new Uint8Array(pngBuffer), {
    headers: { "Content-Type": "image/png" },
  });
}
