import { NextRequest, NextResponse } from "next/server";
import { obtenerSuscripcionPorEmail } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ active: false, error: "Correo requerido." }, { status: 400 });
    }

    const subscription = await obtenerSuscripcionPorEmail(email);
    return NextResponse.json({
      active: subscription.active,
      status: subscription.status,
      perfil: subscription.perfil,
      messages: subscription.messages,
    });
  } catch {
    return NextResponse.json(
      { active: false, error: "No se pudo verificar la suscripción." },
      { status: 500 }
    );
  }
}
