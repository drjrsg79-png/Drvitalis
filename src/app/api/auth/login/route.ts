import { NextRequest, NextResponse } from "next/server";
import { obtenerUsuarioPorEmail } from "@/lib/db";

const emailValido = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const correo = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!emailValido(correo)) {
      return NextResponse.json(
        { error: "Escribe un correo electrónico válido." },
        { status: 400 }
      );
    }

    const usuario = await obtenerUsuarioPorEmail(correo);

    if (!usuario || !usuario.suscripcionActiva) {
      return NextResponse.json({
        active: false,
        perfil: {
          nombre: usuario?.nombre || "",
          email: correo,
          edad: usuario?.edad || "",
          pais: usuario?.pais || "",
          condicion: usuario?.condicion || "",
        },
      });
    }

    return NextResponse.json({
      active: true,
      perfil: {
        nombre: usuario.nombre,
        email: usuario.email,
        edad: usuario.edad || "",
        pais: usuario.pais || "",
        condicion: usuario.condicion || "",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo revisar el acceso. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
