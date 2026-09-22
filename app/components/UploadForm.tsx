"use client";

// Formulario de "subir foto o video", usado desde app/page.tsx dentro de un
// <ModalButton>. Es un componente de cliente porque necesita decidir en el
// navegador, antes de mandar nada, si el archivo es foto o video y elegir un
// camino distinto para cada uno (ver handleSubmit más abajo):
//   - foto  -> Server Action uploadPhoto (viaja como FormData normal)
//   - video -> upload() de @vercel/blob/client, directo al storage, y recién
//              después createUploadedVideoRequest solo para crear el
//              registro en la BD (ver app/api/upload/route.ts para el token).
import { useActionState, useEffect, useRef, useState } from "react";
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
  const [showDescription, setShowDescription] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Guarda sincrónica contra doble envío: disabled={pendingUpload} depende
  // de un re-render, y un doble click (o doble tap en celular) muy rápido
  // puede disparar handleSubmit dos veces antes de que React llegue a
  // deshabilitar el botón. Un ref se lee/escribe al toque, sin esperar
  // ningún render, así que sí corta el segundo intento a tiempo.
  const isSubmittingRef = useRef(false);

  const state = videoState ?? actionState;
  const pendingUpload = pending || videoPending;

  // uploadPhoto (la Server Action, para fotos) no pasa por handleSubmit
  // salvo para armar el FormData, así que el único momento en que sabemos
  // que ya terminó (bien o mal) es cuando cambia actionState.
  useEffect(() => {
    if (actionState) {
      isSubmittingRef.current = false;
    }
  }, [actionState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Siempre a mano, nunca dejando que el <form> dispare su acción nativa
    // también: si se dejan los dos caminos habilitados a la vez (el
    // action={formAction} del form y este onSubmit), algunos navegadores
    // terminan invocando ambos para el mismo archivo y se crea la solicitud
    // duplicada en la BD.
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    const form = formRef.current;
    const fileInput = form?.elements.namedItem("foto") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!file) {
      return;
    }

    isSubmittingRef.current = true;

    // Las fotos siguen su flujo normal (Server Action con recompresión).
    // Los videos van directo navegador -> Vercel Blob: son varias veces más
    // rápido que subirlos primero a nuestro servidor y de ahí a Blob.
    if (!file.type.startsWith("video/")) {
      const formData = new FormData(form!);
      // Se vacía apenas se dispara el envío (no recién cuando termina), así
      // queda claro al toque que esa foto ya se mandó y no se puede
      // reenviar haciendo click de nuevo.
      form?.reset();
      setShowDescription(false);
      formAction(formData);
      return;
    }

    // A diferencia del camino de foto (que arma su propio FormData del DOM
    // más arriba), acá sí hace falta leer la descripción a mano: se llama a
    // createUploadedVideoRequest() con argumentos sueltos, no con un
    // FormData. Se lee antes del form?.reset() de abajo.
    const description =
      (form?.elements.namedItem("descripcion") as HTMLInputElement | null)?.value.trim() ||
      null;

    setVideoState(undefined);
    setVideoPending(true);
    form?.reset();
    setShowDescription(false);

    try {
      const extension = file.name.split(".").pop() || "mp4";
      const photoId = crypto.randomUUID();

      const blob = await upload(`pending/${photoId}.${extension}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });

      await createUploadedVideoRequest({ photoId, fileUrl: blob.url, phase, description });

      setVideoState({ success: true });
    } catch (error) {
      setVideoState({
        error: error instanceof Error ? error.message : "No se pudo subir el video.",
      });
    } finally {
      setVideoPending(false);
      isSubmittingRef.current = false;
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

      {showDescription ? (
        <>
          <label htmlFor={`descripcion-${phase}`}>Descripción (opcional)</label>
          <input
            id={`descripcion-${phase}`}
            name="descripcion"
            type="text"
            placeholder="Ej: Foto del vals"
            autoFocus
          />
        </>
      ) : (
        <button
          type="button"
          className="link-button"
          onClick={() => setShowDescription(true)}
        >
          ¿Deseas agregar descripción?
        </button>
      )}

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
