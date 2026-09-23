// Landing pública de la empresa: qué hacemos, y las dos puertas de entrada
// (iniciar sesión para administrar un evento existente, o crear uno nuevo).
// A diferencia de app/panel/page.tsx (el sitio de UN evento), esta página no
// requiere sesión ni sabe nada de ninguna organización en particular — ver
// proxy.ts, que ya no protege "/".
import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_NAME } from "@/lib/company";
import RevealImage from "./RevealImage";
import Reveal from "./Reveal";

// Metadata propia (no la genérica del layout raíz — ver
// app/layout.tsx#generateMetadata): esta es la única página realmente
// pública/indexable del sitio, así que vale la pena que tenga su propio
// título y descripción para buscadores y al compartir el link.
export const metadata: Metadata = {
  title: `${COMPANY_NAME} · Sitios web para eventos`,
  description:
    "Creamos sitios elegantes para XV años, bodas y todo tipo de celebraciones: invitaciones digitales, galería de fotos compartida y un panel para administrar todo.",
};

const PASOS = [
  {
    title: "Elija su evento y tema",
    description:
      "Cree su cuenta y seleccione el diseño que más se ajuste a su celebración — puede cambiarlo cuando lo desee.",
  },
  {
    title: "Invite a sus invitados",
    description:
      "Cada invitado recibe un código único y su QR para confirmar asistencia, sin necesidad de imprimir nada.",
  },
  {
    title: "Administre todo desde un panel",
    description:
      "Revise confirmaciones, reciba fotos del evento y controle el acceso desde un solo lugar.",
  },
];

const SERVICIOS = [
  {
    title: "Invitaciones digitales",
    description:
      "Cada invitado recibe su propio código y QR — sin imprimir nada, sin perder el control de quién confirmó.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3.5 6.5 12 13.5l8.5-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Galería de fotos compartida",
    description:
      "Sus invitados suben sus fotos y videos del evento; usted decide cuáles se publican en la galería.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M3 16.5 8 11l4 4 3-3 6 5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Diseño a su gusto",
    description:
      "Seleccione la temática de su sitio (XV años, boda, convivio y más) entre varios diseños ya disponibles.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <line x1="4" y1="6" x2="20" y2="6" strokeLinecap="round" />
        <circle cx="9" cy="6" r="1.8" fill="white" />
        <line x1="4" y1="12" x2="20" y2="12" strokeLinecap="round" />
        <circle cx="15" cy="12" r="1.8" fill="white" />
        <line x1="4" y1="18" x2="20" y2="18" strokeLinecap="round" />
        <circle cx="11" cy="18" r="1.8" fill="white" />
      </svg>
    ),
  },
  {
    title: "Proveedores para su evento",
    description:
      "Lo conectamos con camarógrafos, decoradores y otros servicios de confianza para completar su evento.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="8" cy="8" r="3" />
        <circle cx="16" cy="8" r="3" />
        <path d="M3 20c0-3 2.5-5 5-5s5 2 5 5" strokeLinecap="round" />
        <path d="M11 20c0-3 2.5-5 5-5s5 2 5 5" strokeLinecap="round" />
      </svg>
    ),
  },
];

// Las 3 celebraciones que pidió mostrar el usuario en su propia vitrina
// (foto grande + texto, alternando de lado) justo después del hero.
// Fotos de ejemplo (picsum, seed fijo) hasta tener fotos reales.
const TIPOS_EVENTO = [
  {
    title: "Bodas",
    image: "https://picsum.photos/seed/evento-boda-grande/900/675",
    description:
      "Un sitio elegante para acompañar cada momento de su boda: invitación digital, confirmación de asistencia y una galería donde sus invitados comparten los recuerdos del día.",
  },
  {
    title: "Convivios",
    image: "https://picsum.photos/seed/evento-convivio-grande/900/675",
    description:
      "Ideal para reuniones familiares o de amigos: invitaciones simples, lista de confirmados y un espacio donde juntar las fotos de todos en un solo lugar.",
  },
  {
    title: "XV años",
    image: "https://picsum.photos/seed/evento-xv-grande/900/675",
    description:
      "El clásico para unos XV: invitación con el estilo que elija, códigos únicos para cada invitado y una galería que crece con las fotos de la fiesta.",
  },
];

// Imágenes de prueba (placeholder) para mostrar cómo se va a ver la
// galería mientras no tenemos fotos reales de eventos — seeds fijos
// (no random) para que no cambien en cada carga.
const GALERIA_PLACEHOLDER = [
  "https://picsum.photos/seed/evento-plataforma-1/500/500",
  "https://picsum.photos/seed/evento-plataforma-2/500/500",
  "https://picsum.photos/seed/evento-plataforma-3/500/500",
  "https://picsum.photos/seed/evento-plataforma-4/500/500",
  "https://picsum.photos/seed/evento-plataforma-5/500/500",
  "https://picsum.photos/seed/evento-plataforma-6/500/500",
];

// Manchas difuminadas que derivan lento en el fondo — nació en el hero,
// se reusa en "Todo lo que incluye su sitio" y en la galería para que la
// página se sienta animada en más de un lugar, no solo arriba de todo.
function AmbientBackground() {
  return (
    <div className="landing-ambient-bg" aria-hidden="true">
      <span className="landing-ambient-blob landing-ambient-blob--1" />
      <span className="landing-ambient-blob landing-ambient-blob--2" />
      <span className="landing-ambient-blob landing-ambient-blob--3" />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing">
      <header className="landing-header">
        <Link href="/" className="landing-brand">
          {COMPANY_NAME}
        </Link>
        <nav aria-label="Cuenta" className="landing-header-actions">
          <Link href="/login" className="btn btn-ghost">
            Iniciar sesión
          </Link>
          <Link href="/crear-cuenta" className="btn btn-primary">
            Crear mi evento
          </Link>
        </nav>
      </header>

      <section className="landing-hero-full">
        <AmbientBackground />

        <div className="landing-hero-modern">
          <p className="platform-eyebrow">Sitios web para eventos</p>
          <h1 className="landing-hero-modern-title">
            El sitio para su evento, listo en minutos
          </h1>
          <p className="landing-hero-modern-subtitle">
            Creamos sitios elegantes para XV años, bodas y todo tipo de
            celebraciones: invitaciones digitales, galería de fotos compartida
            con sus invitados, y un panel para administrar todo desde un solo
            lugar.
          </p>
          <div className="landing-hero-modern-actions">
            <Link href="/crear-cuenta" className="btn btn-primary">
              Crear mi evento
            </Link>
            <Link href="/login" className="landing-hero-modern-link">
              Ya tengo una cuenta
            </Link>
          </div>
        </div>

        <a href="#landing-panel" className="landing-hero-scroll-cue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Descubrir más</span>
        </a>
      </section>

      <section className="landing-showcase" aria-labelledby="landing-showcase-title">
        <h2 id="landing-showcase-title" className="landing-showcase-title">
          Un sitio para cada celebración
        </h2>
        <ul className="landing-showcase-list">
          {TIPOS_EVENTO.map((tipo, index) => (
            <li
              key={tipo.title}
              className={`landing-showcase-item ${
                index % 2 === 1 ? "landing-showcase-item--reverse" : ""
              }`}
            >
              <div className="landing-showcase-image">
                <RevealImage
                  src={tipo.image}
                  alt=""
                  width={900}
                  height={675}
                  parallaxSpeed={index % 2 === 0 ? 0.8 : -0.8}
                />
              </div>
              <Reveal className="landing-showcase-content">
                <p className="platform-eyebrow">Ideal para</p>
                <h3>{tipo.title}</h3>
                <p>{tipo.description}</p>
                <Link href="/crear-cuenta" className="landing-showcase-link">
                  Crear mi evento →
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <div className="landing-panel" id="landing-panel">
        <section className="landing-steps" aria-labelledby="landing-steps-title">
          <h2 id="landing-steps-title">Cómo funciona</h2>
          <hr className="landing-divider" />
          <ol className="landing-steps-grid">
            {PASOS.map((paso, index) => (
              <li key={paso.title}>
                <span className="landing-step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{paso.title}</h3>
                <p>{paso.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-services-modern" aria-labelledby="landing-services-title">
          <AmbientBackground />
          <h2 id="landing-services-title">Todo lo que incluye su sitio</h2>
          <hr className="landing-divider" />
          <ul className="landing-services-modern-grid">
            {SERVICIOS.map((servicio) => (
              <li key={servicio.title}>
                <div className="landing-service-icon">{servicio.icon}</div>
                <h3>{servicio.title}</h3>
                <p>{servicio.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="landing-gallery" aria-labelledby="landing-gallery-title">
        <AmbientBackground />
        <h2 id="landing-gallery-title">Así se ve la galería de su evento</h2>
        <p className="landing-gallery-subtitle">
          Fotos de ejemplo — cuando cree su sitio, aquí aparecerán las que
          suban sus invitados.
        </p>
        <ul className="landing-gallery-grid">
          {GALERIA_PLACEHOLDER.map((src, index) => (
            <li key={src}>
              <RevealImage
                src={src}
                delayMs={(index % 3) * 100}
                parallaxSpeed={index % 2 === 0 ? 1 : -0.6}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-cta-panel">
        <h2>¿Ya tiene su evento con nosotros?</h2>
        <p className="landing-cta-panel-text">
          Inicie sesión para enviar invitaciones y revisar las fotos de sus
          invitados.
        </p>
        <div className="landing-cta-panel-actions">
          <Link href="/login" className="btn btn-invert-primary">
            Iniciar sesión
          </Link>
          <Link href="/crear-cuenta" className="btn btn-invert-outline">
            Crear mi evento
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <span>
          © {new Date().getFullYear()} {COMPANY_NAME}
        </span>
        <nav aria-label="Accesos rápidos" className="landing-footer-actions">
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/crear-cuenta">Crear mi evento</Link>
        </nav>
      </footer>
    </main>
  );
}
