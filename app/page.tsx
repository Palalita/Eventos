// Landing pública de la empresa: qué hacemos, y las dos puertas de entrada
// (iniciar sesión para administrar un evento existente, o crear uno nuevo).
// A diferencia de app/panel/page.tsx (el sitio de UN evento), esta página no
// requiere sesión ni sabe nada de ninguna organización en particular — ver
// proxy.ts, que ya no protege "/".
import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_NAME } from "@/lib/company";
import { THEMES } from "@/lib/themes";

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
    title: "Elegí tu evento y tema",
    description:
      "Creá tu cuenta y elegí el diseño que más se ajuste a tu celebración — podés cambiarlo cuando quieras.",
  },
  {
    title: "Invitá a tus invitados",
    description:
      "Cada invitado recibe un código único y su QR para confirmar asistencia, sin imprimir nada.",
  },
  {
    title: "Administrá todo en un panel",
    description:
      "Revisá confirmaciones, recibí fotos del evento y controlá el acceso desde un solo lugar.",
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
      "Tus invitados suben sus fotos y videos del evento; vos decidís cuáles se publican en la galería.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="M3 16.5 8 11l4 4 3-3 6 5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Diseño a tu gusto",
    description:
      "Elegí la temática de tu sitio (XV años, boda, convivio y más) entre varios diseños ya armados.",
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
    title: "Proveedores para tu evento",
    description:
      "Te conectamos con camarógrafos, decoradores y otros servicios de confianza para completar tu evento.",
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

      <section className="landing-hero-modern">
        <p className="platform-eyebrow">Sitios web para eventos</p>
        <h1 className="landing-hero-modern-title">
          El sitio de tu evento, listo en minutos
        </h1>
        <p className="landing-hero-modern-subtitle">
          Creamos sitios elegantes para XV años, bodas y todo tipo de
          celebraciones: invitaciones digitales, galería de fotos compartida
          con tus invitados, y un panel para administrar todo desde un solo
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
      </section>

      <div className="landing-panel">
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
          <h2 id="landing-services-title">Todo lo que incluye tu sitio</h2>
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

      <section className="landing-themes" aria-labelledby="landing-themes-title">
        <h2 id="landing-themes-title">Elegí el estilo de tu evento</h2>
        <hr className="landing-divider" />
        <ul className="landing-themes-grid">
          {THEMES.map((theme) => (
            <li key={theme.id} className="landing-theme-card">
              <div className="landing-theme-swatches" aria-hidden="true">
                {theme.preview.map((color, index) => (
                  <span key={index} style={{ background: color }} />
                ))}
              </div>
              <h3>{theme.label}</h3>
              <p>{theme.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-cta-panel">
        <h2>¿Ya tenés tu evento con nosotros?</h2>
        <p className="landing-cta-panel-text">
          Iniciá sesión para mandar invitaciones y revisar las fotos de tus
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
