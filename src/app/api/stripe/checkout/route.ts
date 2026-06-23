import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { email, nombre } = await req.json();
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email || undefined,
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
      success_url: `${baseUrl}/?success=true`,
      cancel_url: `${baseUrl}/`,
      metadata: { nombre: nombre || "" },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Error en /api/stripe/checkout:", err?.message);
    return NextResponse.json(
      { error: "No se pudo crear la sesión de pago." },
      { status: 500 }
    );
  }
}
