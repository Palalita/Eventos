import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { eventConfig } from "@/lib/event-config";
import Countdown from "./Countdown";

const fechaFormateada = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "full",
  timeStyle: "short",
}).format(eventConfig.fechaEvento);

export default async function Home() {
  const session = await getSession();
  const galeria = await db.photoRequest.findMany({
    where: { status: "APPROVED" },
    orderBy: { reviewedAt: "desc" },
    take: 24,
  });

  return (
    <main>
      <nav className="site-nav">
        {session ? (
          <Link href={session.role === "ADMIN" ? "/admin" : "/panel"} className="btn btn-secondary">
            Ir a mi panel
          </Link>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="btn btn-primary">
              Crear invitación
            </Link>
          </>
        )}
      </nav>

      <section className="hero">
        <p className="hero-eyebrow">{eventConfig.lema}</p>
        <h1 className="hero-name">{eventConfig.quinceaneraNombre}</h1>
        <p className="hero-date">
          {fechaFormateada} · {eventConfig.lugar}
        </p>
        <Countdown target={eventConfig.fechaEvento.toISOString()} />
        {!session && (
          <div className="hero-actions">
            <Link href="/registro" className="btn btn-primary">
              Reservar mi invitación
            </Link>
          </div>
        )}
      </section>

      <section className="gallery-section">
        <h2>Galería del evento</h2>
        {galeria.length === 0 ? (
          <p className="gallery-empty">
            Aquí aparecerán las fotos aprobadas del evento.
          </p>
        ) : (
          <div className="gallery-grid">
            {galeria.map((foto) => (
              <Image
                key={foto.id}
                src={`/api/fotos/${foto.fileName}`}
                alt={foto.description ?? "Foto del evento"}
                width={220}
                height={180}
                unoptimized
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
