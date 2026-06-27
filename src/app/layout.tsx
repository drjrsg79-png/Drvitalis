import type { Metadata } from "next";
import Script from "next/script";
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
    priceRange: "$300 MXN/mes",
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
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-KB5PFPMH');`}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KB5PFPMH"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
