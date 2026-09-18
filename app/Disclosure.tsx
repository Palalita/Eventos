"use client";

import { useState, type ReactNode } from "react";

export default function Disclosure({
  label,
  openLabel,
  children,
}: {
  label: string;
  openLabel?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="disclosure">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? (openLabel ?? "Cerrar") : label}
      </button>
      {open && <div className="disclosure-panel card">{children}</div>}
    </div>
  );
}
