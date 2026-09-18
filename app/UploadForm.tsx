"use client";

import { useActionState, useRef } from "react";
import { uploadPhoto, UploadPhotoState } from "@/app/actions/photos";

export default function UploadForm({
  phase,
}: {
  phase: "PRE_EVENT" | "EVENT";
}) {
  const [state, action, pending] = useActionState<UploadPhotoState, FormData>(
    uploadPhoto,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
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

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
