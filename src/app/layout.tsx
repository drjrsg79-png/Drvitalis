import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://drvitalis1.com"),
  title: "Vitalis — Salud Sexual Masculina con Acompañamiento Clínico",
  description:
    "El Dr. Vitalis te acompaña de forma privada y profesional. Orientación inmediata, ejercicios terapéuticos guiados y seguimiento de tu progreso. Disponible 24/7.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Vitalis — Salud Sexual Masculina con Acompañamiento Clínico",
    description:
      "El Dr. Vitalis te acompaña de forma privada y profesional. Orientación inmediata, ejercicios terapéuticos guiados y seguimiento de tu progreso. Disponible 24/7.",
    url: "https://drvitalis1.com",
    siteName: "Vitalis",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Vitalis — Salud Sexual Masculina con Acompañamiento Clínico",
    description:
      "El Dr. Vitalis te acompaña de forma privada y profesional. Disponible 24/7, de forma confidencial.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: "Vitalis",
    description:
      "Asistente clínico digital de salud sexual masculina, desarrollado bajo el enfoque médico del Dr. José Rogelio Sánchez García.",
    url: "https://drvitalis1.com",
    medicalSpecialty: "Urology",
    priceRange: "$599 MXN/mes",
    areaServed: "MX",
    physician: {
      "@type": "Physician",
      name: "Dr. José Rogelio Sánchez García",
      medicalSpecialty: "Medicina Interna y Terapia Intensiva",
    },
  };

  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
