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

export function extensionFor(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/quicktime") return "mov";
  if (mime === "video/webm") return "webm";
  return "jpg";
}

export function statusFolder(status: "PENDING" | "APPROVED" | "REJECTED") {
  return status === "PENDING"
    ? "pending"
    : status === "APPROVED"
      ? "approved"
      : "rejected";
}
