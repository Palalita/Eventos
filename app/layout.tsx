import type { Metadata } from "next";
import { Playfair_Display, Dancing_Script, Poppins } from "next/font/google";
import "./globals.css";
import { getEventSettings } from "@/lib/settings";

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getEventSettings();
  return {
    title: `Mis XV años · ${settings.quinceaneraNombre}`,
    description: "Sitio del evento: invitaciones y galería de fotos.",
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${playfair.variable} ${dancingScript.variable} ${poppins.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
