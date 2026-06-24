import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_URL
  ? (/^https?:\/\//.test(process.env.NEXT_PUBLIC_URL)
      ? process.env.NEXT_PUBLIC_URL
      : `https://${process.env.NEXT_PUBLIC_URL}`)
  : "https://drvitalis1.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vitalis — Salud Sexual Masculina con IA",
    template: "%s — Vitalis",
  },
  description:
    "Tu urólogo experto, disponible las 24 horas. Consulta privada con el Dr. Vitalis, protocolo personalizado con medicamentos y dosis, ejercicios terapéuticos guiados y seguimiento de tu progreso.",
  applicationName: "Vitalis",
  keywords: [
    "salud sexual masculina",
    "urólogo",
    "disfunción eréctil",
    "Dr. Vitalis",
    "protocolo personalizado",
  ],
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Vitalis",
    title: "Vitalis — Salud Sexual Masculina con IA",
    description:
      "Consulta privada 24/7 con el Dr. Vitalis, protocolo personalizado y seguimiento de tu progreso.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitalis — Salud Sexual Masculina con IA",
    description:
      "Consulta privada 24/7 con el Dr. Vitalis, protocolo personalizado y seguimiento de tu progreso.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
