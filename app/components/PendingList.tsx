"use client";

// Lista de fotos/videos pendientes de revisión en el panel de admin
// (renderizada desde app/page.tsx cuando el usuario logueado es ADMIN).
// Recibe los datos ya cargados desde el servidor como prop (`items`) y desde
// acá, en el cliente, llama a la Server Action reviewPhoto para aprobar o
// rechazar sin tener que recargar toda la página.
import { useState, useTransition } from "react";
import { reviewPhoto } from "@/app/actions/photos";
import MediaPreview from "./MediaPreview";

type PendingItem = {
  id: string;
  mediaType: "PHOTO" | "VIDEO";
  description: string | null;
  user: { name: string; email: string };
};

export default function PendingList({
  title,
  items: initialItems,
}: {
  title: string;
  items: PendingItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function handleSubmit(id: string, formData: FormData) {
    setPendingIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      await reviewPhoto(formData);
      // Quita el ítem de inmediato en vez de esperar a que la página
      // entera se vuelva a renderizar, para que la lista (y el mensaje de
      // "No hay solicitudes pendientes") se actualicen al instante.
      setItems((prev) => prev.filter((item) => item.id !== id));
    });
  }

  return (
    <section className="card">
      <h2>{title}</h2>
      {items.length === 0 && <p>No hay solicitudes pendientes.</p>}
      <ul className="review-list">
        {items.map((foto) => {
          const disabled = pendingIds.has(foto.id);
          return (
            <li key={foto.id} className="review-item">
              <MediaPreview
                src={`/api/fotos/${foto.id}`}
                mediaType={foto.mediaType}
                alt={foto.description ?? "Foto del evento"}
                className="thumb-media thumb-media--lg"
              />
              <div className="review-details">
                <p>
                  <strong>{foto.user.name}</strong> ({foto.user.email})
                </p>
                {foto.description && <p>{foto.description}</p>}
                <form
                  className="review-actions"
                  onSubmit={(event) => {
                    // preventDefault a propósito: no queremos la navegación
                    // normal del form, sino armar el FormData a mano (para
                    // saber qué botón —Aprobar o Rechazar— se apretó) y
                    // pasárselo a reviewPhoto() desde el cliente.
                    event.preventDefault();
                    const submitter = (event.nativeEvent as SubmitEvent)
                      .submitter as HTMLButtonElement | null;
                    const formData = new FormData(
                      event.currentTarget,
                      submitter ?? undefined
                    );
                    handleSubmit(foto.id, formData);
                  }}
                >
                  <input type="hidden" name="id" value={foto.id} />
                  <input
                    type="text"
                    name="comentario"
                    aria-label="Comentario (opcional)"
                    placeholder="Comentario (opcional)"
                    disabled={disabled}
                  />
                  <div className="review-buttons">
                    <button
                      type="submit"
                      name="decision"
                      value="APPROVED"
                      className="btn btn-primary"
                      disabled={disabled}
                    >
                      {disabled ? "Guardando..." : "Aprobar"}
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="REJECTED"
                      className="btn btn-danger"
                      disabled={disabled}
                    >
                      Rechazar
                    </button>
                  </div>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
