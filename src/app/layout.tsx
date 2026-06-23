import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vitalis — Salud Sexual Masculina",
  description: "Tu urólogo experto, disponible siempre. Protocolos personalizados, medicamentos con dosis exactas y ejercicios terapéuticos.",
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
