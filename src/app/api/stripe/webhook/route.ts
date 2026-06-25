import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import {
  activarSuscripcion,
  actualizarEstadoPorSubscriptionId,
  marcarPorCustomerId,
  upsertUsuario,
} from "@/lib/db";

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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Pago confirmado: se activa la suscripción del usuario.
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.user_id || null;
        const customerId =
          typeof session.customer === "string" ? session.customer : null;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;
        if (userId) {
          await activarSuscripcion(userId, customerId, subscriptionId);
        } else if (session.customer_details?.email) {
          const recoveredUserId = await upsertUsuario({
            email: session.customer_details.email,
            nombre: session.customer_details.name || "",
          });
          await activarSuscripcion(recoveredUserId, customerId, subscriptionId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        // Suscripción cancelada.
        const sub = event.data.object as Stripe.Subscription;
        await actualizarEstadoPorSubscriptionId(sub.id, "canceled");
        break;
      }
      case "invoice.payment_failed": {
        // Cobro recurrente fallido.
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : null;
        if (customerId) {
          await marcarPorCustomerId(customerId, "past_due");
        }
        break;
      }
      default:
        break;
    }
  } catch {
    // Si la persistencia falla, se responde con error para que Stripe reintente.
    return NextResponse.json(
      { error: "No se pudo procesar el evento." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
