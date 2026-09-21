// Constantes y helpers compartidos por todo el flujo de subida de fotos/
// videos. `app/actions/photos.ts` (subida de fotos vía Server Action) y
// `app/api/upload/route.ts` (subida de videos vía @vercel/blob/client) los
// usan para validar el tipo/tamaño del archivo y decidir nombres de
// carpeta/extensión en Vercel Blob.
import "server-only";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
export const ALLOWED_MIME_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export const MAX_IMAGE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB de entrada; se recomprime antes de subir
export const MAX_VIDEO_SIZE_BYTES = 80 * 1024 * 1024; // 80MB; los videos no se recomprimen

// Toda foto se recodifica a JPEG para maximizar el 1GB gratis de Vercel Blob.
export const OPTIMIZED_MAX_WIDTH = 1600;
export const OPTIMIZED_JPEG_QUALITY = 78;

export function isVideo(mime: string) {
  return ALLOWED_VIDEO_TYPES.includes(mime);
}

// Extensión de archivo a usar en el nombre del blob según el mime type.
// Las fotos casi siempre caen en "jpg" porque photos.ts las recomprime a JPEG
// antes de llamar a esta función (ver ALLOWED_IMAGE_TYPES arriba).
export function extensionFor(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/quicktime") return "mov";
  if (mime === "video/webm") return "webm";
  return "jpg";
}

// Carpeta dentro del bucket de Blob según el estado de moderación, para
// poder mover el archivo de "pending/" a "approved/" o "rejected/" cuando el
// admin revisa la foto (ver reviewPhoto en app/actions/photos.ts).
export function statusFolder(status: "PENDING" | "APPROVED" | "REJECTED") {
  return status === "PENDING"
    ? "pending"
    : status === "APPROVED"
      ? "approved"
      : "rejected";
}
