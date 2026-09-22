// Landing pública de la empresa: qué hacemos, y las dos puertas de entrada
// (iniciar sesión para administrar un evento existente, o crear uno nuevo).
// A diferencia de app/panel/page.tsx (el sitio de UN evento), esta página no
// requiere sesión ni sabe nada de ninguna organización en particular — ver
// proxy.ts, que ya no protege "/".
import type { Metadata } from "next";
import Link from "next/link";

// Nombre de la empresa: un solo lugar para cambiarlo. "Eventos" es un
// placeholder (viene del nombre del repo); reemplazar por el nombre real
// del negocio cuando se defina.
const COMPANY_NAME = "Eventos";

// Metadata propia (no la genérica del layout raíz — ver
// app/layout.tsx#generateMetadata): esta es la única página realmente
// pública/indexable del sitio, así que vale la pena que tenga su propio
// título y descripción para buscadores y al compartir el link.
export const metadata: Metadata = {
  title: `${COMPANY_NAME} · Sitios web para eventos`,
  description:
    "Creamos sitios elegantes para XV años, bodas y todo tipo de celebraciones: invitaciones digitales, galería de fotos compartida y un panel para administrar todo.",
};

const SERVICIOS = [
  {
    icon: "💌",
    title: "Invitaciones digitales",
    description:
      "Cada invitado recibe su propio código y QR — sin imprimir nada, sin perder el control de quién confirmó.",
  },
  {
    icon: "📷",
    title: "Galería de fotos compartida",
    description:
      "Tus invitados suben sus fotos y videos del evento; vos decidís cuáles se publican en la galería.",
  },
  {
    icon: "🎨",
    title: "Diseño a tu gusto",
    description:
      "Elegí la temática de tu sitio (XV años, boda, convivio y más) entre varios diseños ya armados.",
  },
  {
    icon: "🤝",
    title: "Proveedores para tu evento",
    description:
      "Te conectamos con camarógrafos, decoradores y otros servicios de confianza para completar tu evento.",
  },
];

export default function LandingPage() {
  return (
    <main>
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

      <section className="hero landing-hero">
        <p className="hero-eyebrow">Sitios web para eventos</p>
        <h1 className="landing-hero-title">El sitio de tu evento, listo en minutos</h1>
        <p className="landing-hero-subtitle">
          Creamos sitios elegantes para XV años, bodas y todo tipo de
          celebraciones: invitaciones digitales, galería de fotos compartida
          con tus invitados, y un panel para administrar todo desde un solo
          lugar.
        </p>
        <div className="hero-actions">
          <Link href="/crear-cuenta" className="btn btn-primary">
            Crear mi evento
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Ya tengo una cuenta
          </Link>
        </div>
      </section>

      <section className="landing-services" aria-labelledby="landing-services-title">
        <h2 id="landing-services-title">Qué incluye</h2>
        <ul className="landing-services-grid">
          {SERVICIOS.map((servicio) => (
            <li key={servicio.title} className="card service-card">
              <div className="service-icon" aria-hidden="true">
                {servicio.icon}
              </div>
              <h3>{servicio.title}</h3>
              <p>{servicio.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="content-section">
        <h2>¿Ya tenés tu evento con nosotros?</h2>
        <p className="landing-cta-text">
          Iniciá sesión para mandar invitaciones y revisar las fotos de tus
          invitados.
        </p>
        <Link href="/login" className="btn btn-primary landing-cta-action">
          Iniciar sesión
        </Link>
      </section>
    </main>
  );
}
