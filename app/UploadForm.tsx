"use client";

import { useActionState, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  createUploadedVideoRequest,
  uploadPhoto,
  UploadPhotoState,
} from "@/app/actions/photos";

export default function UploadForm({
  phase,
}: {
  phase: "PRE_EVENT" | "EVENT";
}) {
  const [actionState, formAction, pending] = useActionState<UploadPhotoState, FormData>(
    uploadPhoto,
    undefined
  );
  const [videoState, setVideoState] = useState<UploadPhotoState>(undefined);
  const [videoPending, setVideoPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const state = videoState ?? actionState;
  const pendingUpload = pending || videoPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = formRef.current;
    const fileInput = form?.elements.namedItem("foto") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    // Las fotos siguen su flujo normal (Server Action con recompresión).
    // Los videos van directo navegador -> Vercel Blob: son varias veces más
    // rápido que subirlos primero a nuestro servidor y de ahí a Blob.
    if (!file || !file.type.startsWith("video/")) {
      return;
    }

    event.preventDefault();
    setVideoState(undefined);
    setVideoPending(true);

    try {
      const extension = file.name.split(".").pop() || "mp4";
      const photoId = crypto.randomUUID();
      const description =
        (form?.elements.namedItem("descripcion") as HTMLInputElement | null)?.value.trim() ||
        null;

      const blob = await upload(`pending/${photoId}.${extension}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });

      await createUploadedVideoRequest({ photoId, fileUrl: blob.url, phase, description });

      setVideoState({ success: true });
      form?.reset();
    } catch (error) {
      setVideoState({
        error: error instanceof Error ? error.message : "No se pudo subir el video.",
      });
    } finally {
      setVideoPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={handleSubmit}
      className="upload-form"
    >
      <input type="hidden" name="phase" value={phase} />

      <label htmlFor={`foto-${phase}`}>Foto o video</label>
      <input
        id={`foto-${phase}`}
        name="foto"
        type="file"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
        required
      />

      <label htmlFor={`descripcion-${phase}`}>Descripción (opcional)</label>
      <input
        id={`descripcion-${phase}`}
        name="descripcion"
        type="text"
        placeholder="Ej: Foto del vals"
      />

      {state && "error" in state && <p className="form-error">{state.error}</p>}
      {state && "success" in state && (
        <p className="form-success">
          ¡Enviado! Quedará pendiente hasta que el administrador lo revise.
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={pendingUpload}>
        {pendingUpload ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
