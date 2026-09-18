import type { Metadata } from "next";
import { Playfair_Display, Dancing_Script, Poppins } from "next/font/google";
import "./globals.css";
import { eventConfig } from "@/lib/event-config";

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

export const metadata: Metadata = {
  title: `Mis XV años · ${eventConfig.quinceaneraNombre}`,
  description: "Sitio del evento: invitaciones y galería de fotos.",
};

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
