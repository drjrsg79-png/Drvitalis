import { NextRequest, NextResponse } from "next/server";
import { obtenerSesionPorEmail } from "@/lib/db";

const emailValido = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email || !emailValido(email)) {
      return NextResponse.json({ error: "Correo inválido." }, { status: 400 });
    }

    const session = await obtenerSesionPorEmail(email);
    return NextResponse.json({ found: Boolean(session), session });
  } catch {
    return NextResponse.json(
      { error: "No se pudo recuperar la sesión." },
      { status: 500 }
    );
  }
}
