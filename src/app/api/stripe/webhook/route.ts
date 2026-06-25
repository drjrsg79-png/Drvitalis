import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import {
  activarSuscripcion,
  actualizarEstadoPorSubscriptionId,
  marcarPorCustomerId,
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
          let currentPeriodEnd: Date | null = null;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            currentPeriodEnd = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : null;
          }
          await activarSuscripcion(userId, customerId, subscriptionId, currentPeriodEnd);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const status = sub.status === "active" || sub.status === "trialing"
          ? "active"
          : sub.status === "past_due" || sub.status === "unpaid"
            ? "past_due"
            : "canceled";
        await actualizarEstadoPorSubscriptionId(
          sub.id,
          status,
          sub.current_period_end ? new Date(sub.current_period_end * 1000) : null
        );
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
