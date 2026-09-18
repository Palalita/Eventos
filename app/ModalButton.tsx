"use client";

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
