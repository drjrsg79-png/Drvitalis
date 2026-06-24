import { NextRequest, NextResponse } from "next/server";
import { upsertUser } from "@/lib/db";

export const runtime = "nodejs";

// Persiste el perfil capturado en el onboarding. El email es obligatorio
// porque es el identificador del paciente mientras no exista login.
export async function POST(req: NextRequest) {
  try {
    const { email, nombre, edad, pais, condicion } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Falta el correo electronico." }, { status: 400 });
    }

    const edadNum = edad ? parseInt(String(edad), 10) : null;

    const user = await upsertUser({
      email,
      nombre: nombre || null,
      edad: Number.isFinite(edadNum) ? edadNum : null,
      pais: pais || null,
      condicion: condicion || null,
    });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar el perfil." },
      { status: 500 }
    );
  }
}
