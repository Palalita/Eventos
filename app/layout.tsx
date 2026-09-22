// Layout raíz: envuelve TODAS las páginas del sitio (es el único archivo
// obligatorio de Next.js App Router en app/). Acá se cargan las fuentes de
// Google, una sola vez para todo el sitio, y se importa globals.css (el CSS
// global — ver ese archivo para la paleta de colores y componentes .btn,
// .card, etc. que usan las páginas).
import type { Metadata } from "next";
import { Playfair_Display, Alex_Brush, Cormorant, Poppins, Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import { getEventSettings } from "@/lib/settings";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { isValidTheme } from "@/lib/themes";
import { isValidFont } from "@/lib/fonts";
import { COMPANY_NAME } from "@/lib/company";

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

// Las dos fuentes de acá abajo alimentan las combinaciones tipográficas
// "moderna" y "editorial" de lib/fonts.ts — se cargan siempre (como el
// resto) pero solo se usan cuando la organización activa eligió esa
// combinación (ver .font-moderna/.font-editorial en globals.css).
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
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
    // La sesión puede sobrevivir a su organización (la borró un MASTER,
    // por ejemplo) — getEventSettings() intenta crear la fila si falta,
    // y esa escritura viola la foreign key si la organización ya no
    // existe. Sin este try/catch, cualquier página (no solo /panel, que
    // si valida la sesión en proxy.ts) tira 500 para ese visitante.
    try {
      const settings = await getEventSettings(session.organizationId);
      return {
        title: `${settings.tituloEvento} · ${COMPANY_NAME}`,
        description: "Sitio del evento: invitaciones y galería de fotos.",
      };
    } catch (error) {
      console.error("layout: no se pudo leer EventSettings de la sesión", error);
    }
  }
  return {
    title: COMPANY_NAME,
    description: "Sitios web para eventos: invitaciones, fotos y más.",
  };
}

// Qué clase de tema (.theme-xv_rosa_dorado, .theme-boda_salvia, ver
// app/globals.css y lib/themes.ts) va en <html>. Sin sesión con
// organización (landing, login, crear-cuenta, /master, o un MASTER
// logueado) no se aplica ninguna: manda la identidad propia de la
// plataforma que ya vive en :root, no la de ningún cliente.
//
// Caso no cubierto a propósito por ahora: /invitacion/[token] visitada SIN
// sesión (un invitado que todavía no inició sesión, entrando desde su
// link) muestra la identidad de la plataforma en vez del tema de esa
// organización — se resolvería leyendo el token acá, pero este layout no
// tiene el pathname sin agregar ese cableado; queda para la próxima vez
// que se toque el sistema de temas.
async function resolveThemeClassNames() {
  const session = await getSession();
  if (!session?.organizationId) return "";

  const organization = await db.organization.findUnique({
    where: { id: session.organizationId },
    select: { theme: true, font: true },
  });
  if (!organization) return "";

  const themeClassName = isValidTheme(organization.theme) ? `theme-${organization.theme}` : "";
  const fontClassName = isValidFont(organization.font) ? `font-${organization.font}` : "";
  return `${themeClassName} ${fontClassName}`.trim();
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const themeClassNames = await resolveThemeClassNames();

  return (
    <html
      lang="es"
      className={`${playfair.variable} ${alexBrush.variable} ${cormorant.variable} ${poppins.variable} ${manrope.variable} ${fraunces.variable} ${themeClassNames}`}
    >
      <body>{children}</body>
    </html>
  );
}
