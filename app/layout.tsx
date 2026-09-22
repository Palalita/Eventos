// Layout raíz: envuelve TODAS las páginas del sitio (es el único archivo
// obligatorio de Next.js App Router en app/). Acá se cargan las fuentes de
// Google, una sola vez para todo el sitio, y se importa globals.css (el CSS
// global — ver ese archivo para la paleta de colores y componentes .btn,
// .card, etc. que usan las páginas).
import type { Metadata } from "next";
import { Playfair_Display, Alex_Brush, Cormorant, Poppins } from "next/font/google";
import "./globals.css";
import { getEventSettings } from "@/lib/settings";
import { getSession } from "@/lib/session";

// Cada fuente se expone como variable CSS (--font-heading, etc.) en vez de
// aplicarse directo, para que app/globals.css decida dónde usar cada una.
const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

// Nathalia (usada como script en el sitio de referencia) no está en Google
// Fonts; Alex Brush es el reemplazo disponible más cercano en trazo y estilo.
const alexBrush = Alex_Brush({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
});

const cormorant = Cormorant({
  variable: "--font-accent",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// Next.js llama a esto para armar el <title>/<meta> de cada página; como lee
// de la BD, el título del navegador siempre refleja el nombre configurado en
// app/admin/contenido, sin tener que hardcodearlo. Este layout envuelve
// TODAS las rutas, incluidas las públicas (/login, /registro, la futura
// landing en /) donde no hay sesión ni organización todavía — para esas se
// usa un título genérico en vez de fallar.
export async function generateMetadata(): Promise<Metadata> {
  const session = await getSession();
  if (session?.organizationId) {
    const settings = await getEventSettings(session.organizationId);
    return {
      title: `Mis XV años · ${settings.tituloEvento}`,
      description: "Sitio del evento: invitaciones y galería de fotos.",
    };
  }
  return {
    title: "Mis XV años",
    description: "Sitios web para eventos: invitaciones, fotos y más.",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${alexBrush.variable} ${cormorant.variable} ${poppins.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
