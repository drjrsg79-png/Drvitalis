import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { upsertUsuario, asegurarSuscripcion } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, edad, pais, condicion } = await req.json();
    const rawUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:8889";
    // Stripe exige URLs absolutas con esquema. NEXT_PUBLIC_URL puede venir como
    // "drvitalis1.com" sin protocolo, así que se normaliza.
    const baseUrl = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    // Se persiste el perfil y se reserva su suscripción antes de cobrar.
    // Si la base de datos no estuviera disponible, el pago no se bloquea:
    // el webhook vuelve a vincular la suscripción cuando Stripe confirma.
    let userId: string | null = null;
    if (email) {
      try {
        userId = await upsertUsuario({ email, nombre, edad, pais, condicion });
        await asegurarSuscripcion(userId);
      } catch {
        userId = null;
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email || undefined,
      client_reference_id: userId || undefined,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: "Vitalis Pro — Consulta médica mensual",
              description: "Dr. Vitalis: protocolo personalizado, medicamentos, ejercicios y calendario.",
            },
            unit_amount: 59900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: { nombre: nombre || "", user_id: userId || "" },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear la sesión de pago." },
      { status: 500 }
    );
  }
}
