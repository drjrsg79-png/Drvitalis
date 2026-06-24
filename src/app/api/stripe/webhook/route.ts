import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      // Pago confirmado. Aquí se persistirá la suscripción en la base de datos
      // cuando se conecte el almacenamiento (ver pendientes en CLAUDE.md).
      break;
    }
    case "customer.subscription.deleted": {
      // Suscripción cancelada.
      break;
    }
    case "invoice.payment_failed": {
      // Cobro recurrente fallido.
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
