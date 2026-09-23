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

// La foto de portada del layout "cinematica" (lib/layouts.ts) llena la
// pantalla como fondo con object-fit:cover, tanto en celular (recuadro
// angosto y alto) como en escritorio (recuadro ancho y bajo). Una foto muy
// panorámica (gente separada a los costados, como una selfie grupal) pierde
// a alguien en el recorte angosto de celular; una muy vertical pierde la
// parte de arriba/abajo en el recorte ancho de escritorio. Este rango deja
// pasar fotos razonablemente cuadradas o apaisadas (usadas por
// createOrganization en app/actions/organizations.ts y updateEventSettings
// en app/actions/settings.ts, los dos lugares donde se puede subir esta
// foto) — el layout "clasico" no tiene este problema (la foto va en un
// marco chico tipo polaroid, no de fondo a pantalla completa) así que no
// se valida ahí.
export const CINEMA_PHOTO_MIN_ASPECT_RATIO = 0.75; // hasta 3:4 vertical
export const CINEMA_PHOTO_MAX_ASPECT_RATIO = 1.6; // hasta un poco más ancha que 3:2

// Devuelve un mensaje de error si la foto no sirve para el layout
// cinemático, o null si está OK.
export function cinemaPhotoAspectRatioError(
  width: number | undefined,
  height: number | undefined
): string | null {
  if (!width || !height) {
    return "No se pudo leer el tamaño de esa imagen. Probá con otra foto.";
  }
  const ratio = width / height;
  if (ratio > CINEMA_PHOTO_MAX_ASPECT_RATIO) {
    return "Esta foto es demasiado panorámica para el layout Cinemática: en celular recortaría a alguien de los costados. Probá con una foto menos ancha (más cuadrada), o cambiá a layout Clásico.";
  }
  if (ratio < CINEMA_PHOTO_MIN_ASPECT_RATIO) {
    return "Esta foto es demasiado vertical para el layout Cinemática: en pantallas anchas recortaría la parte de arriba o abajo. Probá con una foto menos alargada, o cambiá a layout Clásico.";
  }
  return null;
}
