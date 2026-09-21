"use client";

// Botón flotante que abre un modal con lo que se le pase como `children`.
// app/page.tsx lo usa dos veces: uno con el QR del invitado adentro, otro
// con <UploadForm> adentro — ambos comparten este mismo wrapper.
import { useState, type ReactNode } from "react";

export default function ModalButton({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="floating-btn" onClick={() => setOpen(true)}>
        {icon}
        {label}
      </button>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
