import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { getDb, upsertUser } from "@/lib/db";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Marca una suscripcion existente (por su id de Stripe) con un nuevo estado.
async function actualizarEstado(stripeSubscriptionId: string, status: string) {
  if (!stripeSubscriptionId) return;
  await getDb().sql`
    UPDATE subscriptions
    SET status = ${status}, updated_at = NOW()
    WHERE stripe_subscription_id = ${stripeSubscriptionId}
  `;
}

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
        // Pago confirmado: se garantiza el paciente por su email y se registra
        // (o reactiva) su suscripcion a Vitalis Pro.
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email || session.customer_email;
        if (!email) break;

        const nombre =
          session.metadata?.nombre || session.customer_details?.name || null;
        const user = await upsertUser({ email, nombre });

        const customerId =
          typeof session.customer === "string" ? session.customer : null;
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : null;

        await getDb().sql`
          INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan, precio, moneda)
          VALUES (${user.id}, ${customerId}, ${subscriptionId}, 'active', 'pro', 599, 'mxn')
          ON CONFLICT (stripe_subscription_id) DO UPDATE SET
            status = 'active',
            stripe_customer_id = EXCLUDED.stripe_customer_id,
            updated_at = NOW()
        `;
        break;
      }
      case "customer.subscription.deleted": {
        // Suscripcion cancelada.
        const sub = event.data.object as Stripe.Subscription;
        await actualizarEstado(sub.id, "canceled");
        break;
      }
      case "invoice.payment_failed": {
        // Cobro recurrente fallido.
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === "string" ? invoice.subscription : "";
        await actualizarEstado(subId, "past_due");
        break;
      }
      default:
        break;
    }
  } catch {
    // Si la persistencia falla, se responde 500 para que Stripe reintente el
    // envio del evento mas tarde.
    return NextResponse.json({ error: "Error al procesar el evento." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
