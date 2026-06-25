import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { activarSuscripcion, activarSuscripcionPorEmail, obtenerSesionPorEmail } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { email, checkoutSessionId } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Correo requerido." }, { status: 400 });
    }

    if (checkoutSessionId && typeof checkoutSessionId === "string") {
      const checkout = await stripe.checkout.sessions.retrieve(checkoutSessionId);
      if (checkout.payment_status === "paid" || checkout.status === "complete") {
        const userId = checkout.client_reference_id || checkout.metadata?.user_id || null;
        const customerId =
          typeof checkout.customer === "string" ? checkout.customer : null;
        const subscriptionId =
          typeof checkout.subscription === "string" ? checkout.subscription : null;

        if (userId) {
          await activarSuscripcion(userId, customerId, subscriptionId);
        } else {
          const stripeEmail = checkout.customer_details?.email || checkout.customer_email || email;
          await activarSuscripcionPorEmail(stripeEmail, customerId, subscriptionId);
        }
      }
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
