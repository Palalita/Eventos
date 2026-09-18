"use client";

import { useActionState, useRef } from "react";
import { uploadPhoto, UploadPhotoState } from "@/app/actions/photos";

export default function UploadForm() {
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
      <label htmlFor="foto">Foto del evento</label>
      <input id="foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" required />

      <label htmlFor="descripcion">Descripción (opcional)</label>
      <input id="descripcion" name="descripcion" type="text" placeholder="Ej: Foto del vals" />

      {state && "error" in state && <p className="form-error">{state.error}</p>}
      {state && "success" in state && (
        <p className="form-success">
          ¡Foto enviada! Quedará pendiente hasta que el administrador la revise.
        </p>
      )}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
