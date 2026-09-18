import "server-only";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB de entrada; se recomprime antes de subir

// Toda foto se recodifica a JPEG para maximizar el 1GB gratis de Vercel Blob.
export const OPTIMIZED_MAX_WIDTH = 1600;
export const OPTIMIZED_JPEG_QUALITY = 78;

export function statusFolder(status: "PENDING" | "APPROVED" | "REJECTED") {
  return status === "PENDING"
    ? "pending"
    : status === "APPROVED"
      ? "approved"
      : "rejected";
}
