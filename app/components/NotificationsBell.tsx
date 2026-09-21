"use client";

// Campana de notificaciones en el header del invitado: muestra si sus
// fotos/videos ya revisados fueron aprobados o rechazados (antes esto vivía
// como texto de estado dentro de "Mis envíos en trámite" en el modal de
// subida; ahora ese modal solo lista lo que sigue pendiente, y el resultado
// de lo ya revisado se consulta acá).
//
// El "no leído" se guarda en localStorage (por navegador, no en la BD):
// alcanza para el uso esperado (un solo invitado en su propio celular) sin
// tener que agregar una columna nueva en PhotoRequest.
import { useEffect, useRef, useState } from "react";

export type NotificationItem = {
  id: string;
  mediaType: "PHOTO" | "VIDEO";
  // El query que arma esta lista siempre filtra status != PENDING; se deja
  // ese valor en el tipo solo para que coincida con el enum que devuelve
  // Prisma, nunca se renderiza en la práctica.
  status: "PENDING" | "APPROVED" | "REJECTED";
  description: string | null;
  adminComment: string | null;
  reviewedAt: Date | null;
};

const STORAGE_KEY = "misxv_notifications_seen";

const dateFormatter = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "medium",
  timeStyle: "short",
});

function readSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    // localStorage puede no estar disponible (ventana privada, etc.); sin
    // esto simplemente no se recuerda qué ya se vio, no rompe la campana.
    return new Set();
  }
}

export default function NotificationsBell({ items }: { items: NotificationItem[] }) {
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeenIds(readSeenIds());
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = items.filter((item) => !seenIds.has(item.id)).length;

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        const allIds = items.map((item) => item.id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
        } catch {
          // Ver comentario de readSeenIds: si falla, el badge no se limpia,
          // pero no afecta ver la lista de notificaciones.
        }
        setSeenIds(new Set(allIds));
      }
      return next;
    });
  }

  return (
    <div className="notifications-bell" ref={containerRef}>
      <button
        type="button"
        className="btn btn-ghost notifications-toggle"
        onClick={toggle}
        aria-label="Notificaciones"
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notifications-dropdown">
          <h3>Notificaciones</h3>
          {items.length === 0 ? (
            <p className="notifications-empty">
              Acá vas a ver si tus fotos y videos fueron aprobados o rechazados.
            </p>
          ) : (
            <ul className="notification-list">
              {items.map((item) => {
                const label = item.mediaType === "VIDEO" ? "video" : "foto";
                return (
                  <li
                    key={item.id}
                    className={`notification-item notification-${item.status.toLowerCase()}`}
                  >
                    <p>
                      {item.status === "APPROVED"
                        ? `¡Tu ${label} fue aprobada!`
                        : `Tu ${label} fue rechazada.`}
                      {item.description ? ` "${item.description}"` : ""}
                    </p>
                    {item.adminComment && (
                      <p className="admin-comment">Comentario: {item.adminComment}</p>
                    )}
                    {item.reviewedAt && (
                      <p className="notification-date">
                        {dateFormatter.format(new Date(item.reviewedAt))}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
