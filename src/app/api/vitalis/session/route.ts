import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import {
  activarSuscripcion,
  obtenerEstadoPorEmail,
  obtenerEstadoPorUserId,
} from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const activo = (status: string | null | undefined) =>
  status === "active" || status === "trialing";

export async function POST(req: NextRequest) {
  try {
    const { email, sessionId } = (await req.json()) as {
      email?: string;
      sessionId?: string;
    };

    let estado = null;

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const userId = session.client_reference_id || session.metadata?.user_id || null;
      const customerId = typeof session.customer === "string" ? session.customer : null;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (userId && session.payment_status === "paid") {
        await activarSuscripcion(userId, customerId, subscriptionId);
        estado = await obtenerEstadoPorUserId(userId);
      }
    }

    if (!estado && email) {
      estado = await obtenerEstadoPorEmail(email);
    }

    if (!estado) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      paid: activo(estado.subscription_status),
      perfil: {
        nombre: estado.nombre || "",
        email: estado.email,
        edad: estado.edad ? String(estado.edad) : "",
        pais: estado.pais || "",
        condicion: estado.condicion || "",
      },
      messages: Array.isArray(estado.chat_messages) ? estado.chat_messages : [],
    });
  } catch {
    return NextResponse.json(
      { found: false, error: "No se pudo recuperar la sesión." },
      { status: 500 }
    );
  }
}
