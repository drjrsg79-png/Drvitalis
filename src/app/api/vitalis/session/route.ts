import { NextRequest, NextResponse } from "next/server";
import { obtenerSesionPorEmail, upsertUsuario, asegurarSuscripcion } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, edad, pais, condicion } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Correo requerido." }, { status: 400 });
    }

    if (nombre || edad || pais || condicion) {
      const userId = await upsertUsuario({
        email,
        nombre: nombre || "",
        edad: edad || "",
        pais: pais || "",
        condicion: condicion || "",
      });
      await asegurarSuscripcion(userId);
    }

    const session = await obtenerSesionPorEmail(email);
    return NextResponse.json(session);
  } catch {
    return NextResponse.json(
      { error: "No se pudo validar el acceso." },
      { status: 500 }
    );
  }
}
