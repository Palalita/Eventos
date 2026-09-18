import "server-only";
import path from "node:path";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export function statusFolder(status: "PENDING" | "APPROVED" | "REJECTED") {
  return status === "PENDING"
    ? "pending"
    : status === "APPROVED"
      ? "approved"
      : "rejected";
}

export function extensionFromMime(mime: string) {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  return "";
}
