// "/panel" es el sitio de UN evento/organización (antes vivía en "/", que
// ahora es la landing de la empresa — ver app/page.tsx). Home() decide qué
// renderizar según el rol de quien está logueado (requireOrgSession(), en
// lib/dal.ts, ya se encarga de mandar a /login a quien no tenga sesión con
// organización). Es un Server Component async: todo lo que ves acá arriba
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
import { requireOrgSession } from "@/lib/dal";
import { getEventSettings, getSectionFlags } from "@/lib/settings";
import { logout } from "@/app/actions/auth";
import Countdown from "../components/Countdown";
import UploadForm from "../components/UploadForm";
import ModalButton from "../components/ModalButton";
import MediaPreview from "../components/MediaPreview";
import Reveal from "../components/Reveal";
import ScrollHint from "../components/ScrollHint";
import HeroPhoto from "../components/HeroPhoto";
import PendingList from "../components/PendingList";
import NotificationsBell from "../components/NotificationsBell";

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
  const session = await requireOrgSession(); // redirige a /login si no hay sesión (u organización)
  const [user, settings, flags] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: session.userId } }),
    getEventSettings(session.organizationId),
    getSectionFlags(session.organizationId),
  ]);

  // Solo se consulta para invitados: es lo que alimenta la campana de
  // notificaciones del header (ver NotificationsBell), que a un admin no le
  // aplica.
  const notifications =
    user.role === "GUEST"
      ? await db.photoRequest.findMany({
          where: {
            userId: user.id,
            organizationId: session.organizationId,
            status: { not: "PENDING" },
          },
          orderBy: { reviewedAt: "desc" },
          take: 20,
          select: {
            id: true,
            mediaType: true,
            status: true,
            description: true,
            adminComment: true,
            reviewedAt: true,
          },
        })
      : [];

  const fechaFormateada = fechaEventoFormatter.format(settings.fechaEvento);

  return (
    <main style={user.role === "GUEST" ? { paddingBottom: "5rem" } : undefined}>
      <header className="dashboard-header" style={{ padding: "1.5rem 1.5rem 0" }}>
        <div>
          <p className="hero-eyebrow" style={{ fontSize: "1.2rem", margin: 0 }}>
            {settings.lema}
          </p>
          <h1 style={{ margin: 0 }}>{settings.tituloEvento}</h1>
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
          {user.role === "GUEST" && <NotificationsBell items={notifications} />}
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
          <AdminHome organizationId={session.organizationId} />
          <MediaGallery
            organizationId={session.organizationId}
            phase="PRE_EVENT"
            title="Fotos y videos preevento"
          />
          <MediaGallery
            organizationId={session.organizationId}
            phase="EVENT"
            title="Fotos y videos del evento"
          />
        </>
      ) : settings.lugar.trim() === "" ? (
        // El admin todavía no cargó el lugar del evento (campo obligatorio
        // de app/admin/contenido/page.tsx) — señal de que nunca guardó el
        // formulario de contenido, así que la portada seguiría mostrando
        // "hoy" como fecha y sin lugar. Mejor este aviso que una portada a
        // medio armar apenas el invitado se registra.
        <SitioEnPreparacion nombreEvento={settings.tituloEvento} />
      ) : (
        <>
          <GuestHero settings={settings} fechaFormateada={fechaFormateada} />
          <GuestHome
            organizationId={session.organizationId}
            settings={settings}
            flags={flags}
            qrToken={user.qrToken}
            attended={user.attended}
            userId={user.id}
          />
        </>
      )}
    </main>
  );
}

// Lo que ve un invitado si entra antes de que el admin termine de cargar el
// contenido de su evento (ver el chequeo de settings.lugar más arriba). El
// tema/tipografía que eligió ese admin ya se aplica solo (vía la clase
// .theme-*/.font-* que app/layout.tsx pone en <html> según la sesión), así
// que esto se ve distinto para cada organización sin código extra acá.
function SitioEnPreparacion({ nombreEvento }: { nombreEvento: string }) {
  return (
    <section className="hero site-building">
      <Reveal>
        <div className="site-building-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a5 5 0 0 1-6.8 6.8L5.5 21.5a1.5 1.5 0 0 1-2-2L12.7 10a5 5 0 0 1 6.8-6.8Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="hero-eyebrow-italic">{nombreEvento}</p>
        <h1 className="site-building-title">El sitio se está preparando</h1>
        <p className="site-building-text">
          El administrador todavía está armando el contenido de este evento.
          Vuelve a entrar más tarde para ver las novedades.
        </p>
      </Reveal>
    </section>
  );
}

// Panel que ve el admin debajo del header: contador de pendientes/aprobadas/
// asistencia, y las dos listas de moderación (PendingList hace el trabajo
// pesado de aprobar/rechazar, ver app/PendingList.tsx).
async function AdminHome({ organizationId }: { organizationId: string }) {
  const [pendientesPre, pendientesEvento, totalAprobadas, totalInvitados, totalAsistieron] =
    await Promise.all([
      db.photoRequest.findMany({
        where: { organizationId, status: "PENDING", phase: "PRE_EVENT" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      db.photoRequest.findMany({
        where: { organizationId, status: "PENDING", phase: "EVENT" },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      }),
      db.photoRequest.count({ where: { organizationId, status: "APPROVED" } }),
      db.user.count({ where: { organizationId, role: "GUEST" } }),
      db.user.count({ where: { organizationId, role: "GUEST", attended: true } }),
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
            <HeroPhoto src={fotoSrc} alt={settings.tituloEvento} />
          ) : (
            <div className="hero-polaroid-placeholder">Mis XV años</div>
          )}
          <span className="hero-seal">XV</span>
        </div>
      </Reveal>

      <Reveal delay={150}>
        <div className="hero-name-wrap">
          <h1 className="hero-name-script">{settings.tituloEvento}</h1>
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
  organizationId,
  settings,
  flags,
  qrToken,
  attended,
  userId,
}: {
  organizationId: string;
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
        <MediaGallery
          organizationId={organizationId}
          phase="PRE_EVENT"
          title="Fotos y videos preevento"
        />
      )}
      {flags.evento_ver && (
        <MediaGallery
          organizationId={organizationId}
          phase="EVENT"
          title="Fotos y videos del evento"
        />
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
              <MisEnvios organizationId={organizationId} phase="PRE_EVENT" userId={userId} />
            </ModalButton>
          )}

          {flags.evento_subir && (
            <ModalButton label="Subir del evento" icon="🎥">
              <h2>Subir foto o video del evento</h2>
              <UploadForm phase="EVENT" />
              <MisEnvios organizationId={organizationId} phase="EVENT" userId={userId} />
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
async function MediaGallery({
  organizationId,
  phase,
  title,
}: {
  organizationId: string;
  phase: Phase;
  title: string;
}) {
  const items = await db.photoRequest.findMany({
    where: { organizationId, status: "APPROVED", phase },
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
// `take` limitado a propósito: sin tope, un invitado con muchos envíos
// acumulados termina viendo docenas de miniaturas cada vez que abre el
// modal de subir — cada una pide /api/fotos/[id] por separado, lo que
// puede saturar la conexión del navegador y hasta bloquear el envío de una
// foto nueva.
const MIS_ENVIOS_LIMIT = 8;

// Solo lo que sigue PENDING: el resultado de lo ya revisado (aprobado o
// rechazado) se mueve a la campana de notificaciones del header
// (NotificationsBell) en vez de quedar acá, para no mezclar "lo que estoy
// esperando que revisen" con "lo que ya me contestaron".
async function MisEnvios({
  organizationId,
  phase,
  userId,
}: {
  organizationId: string;
  phase: Phase;
  userId: string;
}) {
  const items = await db.photoRequest.findMany({
    where: { organizationId, userId, phase, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    take: MIS_ENVIOS_LIMIT,
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
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
