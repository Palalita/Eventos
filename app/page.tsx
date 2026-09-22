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
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.2rem 1.5rem",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "1.6rem",
            color: "var(--rose-dark)",
          }}
        >
          {COMPANY_NAME}
        </span>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Link href="/login" className="btn btn-ghost">
            Iniciar sesión
          </Link>
          <Link href="/crear-cuenta" className="btn btn-primary">
            Crear mi evento
          </Link>
        </div>
      </header>

      <section className="hero" style={{ minHeight: "auto", padding: "2.5rem 1.5rem 3rem" }}>
        <p className="hero-eyebrow">Sitios web para eventos</p>
        <h1 style={{ maxWidth: "620px" }}>
          El sitio de tu evento, listo en minutos
        </h1>
        <p style={{ maxWidth: "520px", fontSize: "1.05rem" }}>
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

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "1rem 1.5rem 3rem" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.8rem" }}>Qué incluye</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.2rem",
          }}
        >
          {SERVICIOS.map((servicio) => (
            <div key={servicio.title} className="card" style={{ margin: 0 }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
                {servicio.icon}
              </div>
              <h3>{servicio.title}</h3>
              <p style={{ fontSize: "0.92rem", margin: 0 }}>{servicio.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section">
        <h2>¿Ya tenés tu evento con nosotros?</h2>
        <p style={{ fontFamily: "var(--font-body)", fontStyle: "normal" }}>
          Iniciá sesión para mandar invitaciones y revisar las fotos de tus
          invitados.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ marginTop: "0.8rem" }}>
          Iniciar sesión
        </Link>
      </section>
    </main>
  );
}
