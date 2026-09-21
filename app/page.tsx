// La página "/" es EL sitio: no hay rutas separadas para admin y para
// invitado. Home() decide qué renderizar según el rol de quien está logueado
// (verifySession(), en lib/dal.ts, ya se encarga de mandar a /login a quien
// no tenga sesión). Es un Server Component async: todo lo que ves acá arriba
// (await db..., await getEventSettings()...) corre en el servidor antes de
// mandar el HTML ya armado al navegador — por eso no hace falta un
// "loading spinner" para estos datos.
//
// Mapa del archivo:
//   Home()            -> arma el header y elige la rama admin o invitado
//   AdminHome()        -> estadísticas + listas de fotos pendientes (admin)
//   GuestHero()         -> la "portada" animada que ve el invitado al entrar
//   GuestHome()         -> secciones activables + barra flotante (QR/subir)
//   MediaGallery()      -> el collage de fotos/videos aprobados
//   MisEnvios()         -> "mis envíos en trámite" de un invitado puntual
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { getEventSettings, getSectionFlags } from "@/lib/settings";
import { logout } from "@/app/actions/auth";
import Countdown from "./components/Countdown";
import UploadForm from "./components/UploadForm";
import ModalButton from "./components/ModalButton";
import MediaPreview from "./components/MediaPreview";
import Reveal from "./components/Reveal";
import ScrollHint from "./components/ScrollHint";
import HeroPhoto from "./components/HeroPhoto";
import PendingList from "./components/PendingList";

type EventSettings = Awaited<ReturnType<typeof getEventSettings>>;
type SectionFlags = Awaited<ReturnType<typeof getSectionFlags>>;
type Phase = "PRE_EVENT" | "EVENT";

const estadoLabel: Record<string, string> = {
  PENDING: "Pendiente de revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const fechaEventoFormatter = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "full",
  timeStyle: "short",
});

export default async function Home() {
  const session = await verifySession(); // redirige a /login si no hay sesión
  const [user, settings, flags] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.userId } }),
    getEventSettings(),
    getSectionFlags(),
  ]);

  const fechaFormateada = fechaEventoFormatter.format(settings.fechaEvento);

  return (
    <main style={user.role === "GUEST" ? { paddingBottom: "5rem" } : undefined}>
      <header className="dashboard-header" style={{ padding: "1.5rem 1.5rem 0" }}>
        <div>
          <p className="hero-eyebrow" style={{ fontSize: "1.2rem", margin: 0 }}>
            {settings.lema}
          </p>
          <h1 style={{ margin: 0 }}>{settings.quinceaneraNombre}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          {user.role === "ADMIN" && (
            <>
              <Link href="/admin/invitaciones" className="btn btn-secondary">
                Invitaciones
              </Link>
              <Link href="/admin/invitados" className="btn btn-secondary">
                Invitados
              </Link>
              <Link href="/admin/paginas" className="btn btn-secondary">
                Páginas
              </Link>
              <Link href="/admin/contenido" className="btn btn-secondary">
                Contenido
              </Link>
              <Link href="/admin/dispositivos" className="btn btn-secondary">
                Dispositivos
              </Link>
            </>
          )}
          <form action={logout}>
            <button type="submit" className="btn btn-ghost">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {user.role === "ADMIN" ? (
        <>
          <section className="hero" style={{ minHeight: "auto", padding: "1.5rem" }}>
            <p className="hero-date">
              {fechaFormateada} · {settings.lugar}
            </p>
            <Countdown target={settings.fechaEvento.toISOString()} />
          </section>
          <AdminHome />
          <MediaGallery phase="PRE_EVENT" title="Fotos y videos preevento" />
          <MediaGallery phase="EVENT" title="Fotos y videos del evento" />
        </>
      ) : (
        <>
          <GuestHero settings={settings} fechaFormateada={fechaFormateada} />
          <GuestHome settings={settings} flags={flags} qrToken={user.qrToken} attended={user.attended} userId={user.id} />
        </>
      )}
    </main>
  );
}

// Panel que ve el admin debajo del header: contador de pendientes/aprobadas/
// asistencia, y las dos listas de moderación (PendingList hace el trabajo
// pesado de aprobar/rechazar, ver app/PendingList.tsx).
async function AdminHome() {
  const [pendientesPre, pendientesEvento, totalAprobadas, totalInvitados, totalAsistieron] =
    await Promise.all([
      db.photoRequest.findMany({
        where: { status: "PENDING", phase: "PRE_EVENT" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      db.photoRequest.findMany({
        where: { status: "PENDING", phase: "EVENT" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      db.photoRequest.count({ where: { status: "APPROVED" } }),
      db.user.count({ where: { role: "GUEST" } }),
      db.user.count({ where: { role: "GUEST", attended: true } }),
    ]);

  return (
    <div className="dashboard" style={{ paddingTop: 0 }}>
      <section className="stats-row">
        <div className="stat">
          <strong>{pendientesPre.length + pendientesEvento.length}</strong>
          <span>Solicitudes pendientes</span>
        </div>
        <div className="stat">
          <strong>{totalAprobadas}</strong>
          <span>Aprobadas</span>
        </div>
        <div className="stat">
          <strong>
            {totalAsistieron}/{totalInvitados}
          </strong>
          <span>Invitados asistieron</span>
        </div>
      </section>

      <PendingList title="Solicitudes preevento" items={pendientesPre} />
      <PendingList title="Solicitudes del evento" items={pendientesEvento} />
    </div>
  );
}

// La "portada" que ve un invitado (GUEST) al entrar: foto tipo polaroid,
// nombre en script, contador y la flechita de scroll. Cada bloque está
// envuelto en <Reveal> para que aparezca con una animación al hacer scroll
// (o de entrada, ya que están arriba de todo) — ver app/Reveal.tsx.
function GuestHero({
  settings,
  fechaFormateada,
}: {
  settings: EventSettings;
  fechaFormateada: string;
}) {
  // ?v=timestamp para invalidar la caché del navegador/CDN cuando el admin
  // sube una foto principal nueva (mismo nombre de archivo en Blob, ver
  // updateEventSettings en app/actions/settings.ts).
  const fotoSrc = settings.fotoPrincipalUrl
    ? `${settings.fotoPrincipalUrl}?v=${settings.updatedAt.getTime()}`
    : null;

  return (
    <section className="guest-hero">
      <span className="hero-bloom hero-bloom--tl" aria-hidden="true" />
      <span className="hero-bloom hero-bloom--tr" aria-hidden="true" />
      <span className="hero-bloom hero-bloom--bl" aria-hidden="true" />
      <span className="hero-bloom hero-bloom--br" aria-hidden="true" />

      <p className="hero-eyebrow-italic">{settings.lema}</p>

      <Reveal>
        <div className="hero-polaroid">
          {fotoSrc ? (
            <HeroPhoto src={fotoSrc} alt={settings.quinceaneraNombre} />
          ) : (
            <div className="hero-polaroid-placeholder">Mis XV años</div>
          )}
          <span className="hero-seal">XV</span>
        </div>
      </Reveal>

      <Reveal delay={150}>
        <div className="hero-name-wrap">
          <h1 className="hero-name-script">{settings.quinceaneraNombre}</h1>
          <p className="hero-date">
            {fechaFormateada} · {settings.lugar}
          </p>
        </div>
      </Reveal>

      <Reveal delay={300}>
        <Countdown target={settings.fechaEvento.toISOString()} />
      </Reveal>

      <ScrollHint />
    </section>
  );
}

// El resto de la página para un invitado: las secciones que el admin puede
// activar/desactivar desde app/admin/paginas (`flags`, ver lib/site-sections.ts
// y lib/settings.ts), más la barra flotante fija abajo con accesos rápidos
// al QR propio y a subir fotos/videos (cada uno dentro de un ModalButton).
function GuestHome({
  settings,
  flags,
  qrToken,
  attended,
  userId,
}: {
  settings: EventSettings;
  flags: SectionFlags;
  qrToken: string;
  attended: boolean;
  userId: string;
}) {
  return (
    <>
      {flags.invitacion && <InvitacionSection settings={settings} />}
      {flags.save_the_date && <SaveTheDateSection settings={settings} />}
      {flags.preevento_ver && (
        <MediaGallery phase="PRE_EVENT" title="Fotos y videos preevento" />
      )}
      {flags.evento_ver && (
        <MediaGallery phase="EVENT" title="Fotos y videos del evento" />
      )}

      <div className="floating-bar">
        <div className="floating-bar-inner">
          <ModalButton label="Ver mi código QR" icon="🎟️">
            <h2>Mi invitación</h2>
            <div className="invite-qr">
              <Image
                src={`/api/qr/${qrToken}`}
                alt="Código QR de tu invitación"
                width={220}
                height={220}
                unoptimized
              />
            </div>
            <p>
              {attended
                ? "✓ Ya registraste tu asistencia al evento."
                : "Muestra este código QR en la entrada del evento."}
            </p>
          </ModalButton>

          {flags.preevento_subir && (
            <ModalButton label="Subir preevento" icon="📷">
              <h2>Subir foto o video preevento</h2>
              <UploadForm phase="PRE_EVENT" />
              <MisEnvios phase="PRE_EVENT" userId={userId} />
            </ModalButton>
          )}

          {flags.evento_subir && (
            <ModalButton label="Subir del evento" icon="🎥">
              <h2>Subir foto o video del evento</h2>
              <UploadForm phase="EVENT" />
              <MisEnvios phase="EVENT" userId={userId} />
            </ModalButton>
          )}
        </div>
      </div>
    </>
  );
}

function InvitacionSection({ settings }: { settings: EventSettings }) {
  return (
    <Reveal>
      <section className="content-section">
        <h2>Invitación e Indicaciones</h2>
        <p>{settings.lugar}</p>
        {settings.indicaciones && <p>{settings.indicaciones}</p>}
      </section>
    </Reveal>
  );
}

function SaveTheDateSection({ settings }: { settings: EventSettings }) {
  if (!settings.saveTheDateMensaje) return null;
  return (
    <Reveal>
      <section className="content-section">
        <h2>Save the Date</h2>
        <p>{settings.saveTheDateMensaje}</p>
      </section>
    </Reveal>
  );
}

// El collage público de fotos/videos ya aprobados por el admin. Se usa tanto
// para el admin (mostrando ambas fases siempre) como para el invitado (solo
// si la sección correspondiente está activada en `flags`). Nótese que acá
// `src` es item.fileUrl directo (la URL pública de Blob) — a diferencia de
// MisEnvios() más abajo, que usa la ruta protegida /api/fotos/[id], porque
// una foto ya APPROVED es pública por definición y no necesita chequeo de
// permisos.
async function MediaGallery({ phase, title }: { phase: Phase; title: string }) {
  const items = await db.photoRequest.findMany({
    where: { status: "APPROVED", phase },
    orderBy: { reviewedAt: "desc" },
    take: 40,
  });

  return (
    <Reveal className="gallery-section">
      <h2>{title}</h2>
      {items.length === 0 ? (
        <p className="gallery-empty">
          Aquí aparecerán las fotos y videos aprobados.
        </p>
      ) : (
        <div className="collage">
          {items.map((item, index) => (
            <MediaPreview
              key={item.id}
              src={item.fileUrl}
              mediaType={item.mediaType}
              alt={item.description ?? "Foto del evento"}
              loading={index < 6 ? "eager" : "lazy"}
              autoPlay={item.mediaType === "VIDEO"}
            />
          ))}
        </div>
      )}
    </Reveal>
  );
}

// Lista privada de "tus fotos/videos que todavía no se aprobaron" (o que se
// rechazaron), dentro del modal de subida de cada invitado. Usa /api/fotos/[id]
// como src porque estas fotos NO son públicas todavía — esa ruta verifica
// que quien pide la imagen sea su dueño (ver app/api/fotos/[id]/route.ts).
async function MisEnvios({ phase, userId }: { phase: Phase; userId: string }) {
  const items = await db.photoRequest.findMany({
    where: { userId, phase, status: { not: "APPROVED" } },
    orderBy: { createdAt: "desc" },
  });

  if (items.length === 0) return null;

  return (
    <>
      <h3 style={{ marginTop: "1.5rem" }}>Mis envíos en trámite</h3>
      <ul className="photo-list">
        {items.map((foto) => (
          <li key={foto.id} className="photo-list-item">
            <MediaPreview
              src={`/api/fotos/${foto.id}`}
              mediaType={foto.mediaType}
              alt={foto.description ?? "Foto del evento"}
              className="thumb-media thumb-media--sm"
            />
            <div>
              <p className={`status-badge status-${foto.status.toLowerCase()}`}>
                {estadoLabel[foto.status]}
              </p>
              {foto.description && <p>{foto.description}</p>}
              {foto.adminComment && (
                <p className="admin-comment">Comentario: {foto.adminComment}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
