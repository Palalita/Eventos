"use client";

// Formulario de "subir foto o video", usado desde app/page.tsx dentro de un
// <ModalButton>. Es un componente de cliente porque necesita decidir en el
// navegador, antes de mandar nada, si el archivo es foto o video y elegir un
// camino distinto para cada uno (ver handleSubmit más abajo):
//   - foto  -> Server Action uploadPhoto (viaja como FormData normal)
//   - video -> upload() de @vercel/blob/client, directo al storage, y recién
//              después createUploadedVideoRequest solo para crear el
//              registro en la BD (ver app/api/upload/route.ts para el token).
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
    // Siempre a mano, nunca dejando que el <form> dispare su acción nativa
    // también: si se dejan los dos caminos habilitados a la vez (el
    // action={formAction} del form y este onSubmit), algunos navegadores
    // terminan invocando ambos para el mismo archivo y se crea la solicitud
    // duplicada en la BD.
    event.preventDefault();

    const form = formRef.current;
    const fileInput = form?.elements.namedItem("foto") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      return;
    }

    // Las fotos siguen su flujo normal (Server Action con recompresión).
    // Los videos van directo navegador -> Vercel Blob: son varias veces más
    // rápido que subirlos primero a nuestro servidor y de ahí a Blob.
    if (!file.type.startsWith("video/")) {
      formAction(new FormData(form!));
      return;
    }

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
