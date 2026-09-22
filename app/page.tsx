// Landing pública de la empresa: qué hacemos, y las dos puertas de entrada
// (iniciar sesión para administrar un evento existente, o crear uno nuevo).
// A diferencia de app/panel/page.tsx (el sitio de UN evento), esta página no
// requiere sesión ni sabe nada de ninguna organización en particular — ver
// proxy.ts, que ya no protege "/".
import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_NAME } from "@/lib/company";

// Metadata propia (no la genérica del layout raíz — ver
// app/layout.tsx#generateMetadata): esta es la única página realmente
// pública/indexable del sitio, así que vale la pena que tenga su propio
// título y descripción para buscadores y al compartir el link.
export const metadata: Metadata = {
  title: `${COMPANY_NAME} · Sitios web para eventos`,
  description:
    "Creamos sitios elegantes para XV años, bodas y todo tipo de celebraciones: invitaciones digitales, galería de fotos compartida y un panel para administrar todo.",
};

const HIGHLIGHTS = [
  "Código de invitación único",
  "Galería compartida",
  "Panel de administración",
  "Temas para elegir",
];

const SERVICIOS = [
  {
    title: "Invitaciones digitales",
    description:
      "Cada invitado recibe su propio código y QR — sin imprimir nada, sin perder el control de quién confirmó.",
  },
  {
    title: "Galería de fotos compartida",
    description:
      "Tus invitados suben sus fotos y videos del evento; vos decidís cuáles se publican en la galería.",
  },
  {
    title: "Diseño a tu gusto",
    description:
      "Elegí la temática de tu sitio (XV años, boda, convivio y más) entre varios diseños ya armados.",
  },
  {
    title: "Proveedores para tu evento",
    description:
      "Te conectamos con camarógrafos, decoradores y otros servicios de confianza para completar tu evento.",
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
        <div className="landing-highlights">
          <ul className="landing-highlights-list">
            {HIGHLIGHTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <section className="landing-services-modern" aria-labelledby="landing-services-title">
          <h2 id="landing-services-title">Todo lo que incluye tu sitio</h2>
          <hr className="landing-divider" />
          <ul className="landing-services-modern-grid">
            {SERVICIOS.map((servicio) => (
              <li key={servicio.title}>
                <h3>{servicio.title}</h3>
                <p>{servicio.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

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
      </footer>
    </main>
  );
}
