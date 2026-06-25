import Stripe from "stripe";
import {
  actualizarEstadoPorSubscriptionId,
  marcarPorCustomerId,
  normalizeEmail,
  upsertStripeSubscription,
} from "../../src/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const unixDate = (value?: number | null) => (value ? new Date(value * 1000) : null);

async function emailForCustomer(customerId: string | null): Promise<string> {
  if (!customerId) return "";
  const customer = await stripe.customers.retrieve(customerId);
  if ("deleted" in customer && customer.deleted) return "";
  return "email" in customer ? normalizeEmail(customer.email) : "";
}

async function persistSubscription(sub: Stripe.Subscription, fallbackEmail = "") {
  const customerId = typeof sub.customer === "string" ? sub.customer : null;
  const email = normalizeEmail(sub.metadata?.email || fallbackEmail || await emailForCustomer(customerId));
  if (!email) return;

  await upsertStripeSubscription({
    email,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    plan: "pro",
    currentPeriodStart: unixDate(sub.current_period_start),
    currentPeriodEnd: unixDate(sub.current_period_end),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "Método no permitido" }, { status: 405 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || "");
  } catch {
    return Response.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await persistSubscription(sub, session.customer_details?.email || session.customer_email || session.metadata?.email || "");
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await persistSubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await persistSubscription(sub);
        await actualizarEstadoPorSubscriptionId(sub.id, sub.status || "canceled", unixDate(sub.current_period_end));
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await persistSubscription(sub, invoice.customer_email || "");
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (customerId) {
          await marcarPorCustomerId(customerId, "past_due");
        }
        break;
      }
      default:
        break;
    }
  } catch {
    return Response.json({ error: "No se pudo procesar el evento." }, { status: 500 });
  }

  return Response.json({ received: true });
};
