import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_SIZE_BYTES } from "@/lib/uploads";

// Emite el token que el navegador usa para subir el video DIRECTO a Vercel
// Blob (sin pasar por nuestro servidor), lo que hace la subida mucho más
// rápida que el flujo anterior de Server Action + buffer en memoria.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const session = await getSession();
        if (!session?.userId) {
          throw new Error("No autorizado");
        }
        // Los invitados solo pueden pedir tokens para subir a "pending/":
        // el paso a "approved/rejected" solo lo hace reviewPhoto (admin).
        if (!pathname.startsWith("pending/")) {
          throw new Error("Ruta no permitida");
        }

        return {
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_SIZE_BYTES,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async () => {
        // El registro en la base de datos lo crea el cliente justo después
        // de que `upload()` resuelve (ver UploadForm) para no depender de
        // este webhook, que no llega en desarrollo local.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 400 }
    );
  }
}
