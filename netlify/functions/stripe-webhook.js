const Stripe = require("stripe");
const { db, json } = require("./_auth");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

function normalizeStatus(status) {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid") return "past_due";
  return "canceled";
}

async function upsertSubscription({ email, customerId, subscriptionId, status, currentPeriodEnd }) {
  const userRows = await db.sql`
    insert into users (email)
    values (${email})
    on conflict (email) do update set email = excluded.email
    returning id
  `;
  const userId = userRows[0].id;

  await db.sql`
    insert into subscriptions (
      user_id,
      stripe_customer_id,
      stripe_subscription_id,
      status,
      current_period_end
    )
    values (
      ${userId},
      ${customerId},
      ${subscriptionId},
      ${status},
      ${currentPeriodEnd}
    )
    on conflict (user_id) do update set
      stripe_customer_id = coalesce(excluded.stripe_customer_id, subscriptions.stripe_customer_id),
      stripe_subscription_id = coalesce(excluded.stripe_subscription_id, subscriptions.stripe_subscription_id),
      status = excluded.status,
      current_period_end = coalesce(excluded.current_period_end, subscriptions.current_period_end)
  `;
}

exports.handler = async (event) => {
  const signature = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch {
    return json(400, { error: "Firma inválida." });
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
        const customerId = typeof session.customer === "string" ? session.customer : null;
        const subscriptionId = typeof session.subscription === "string" ? session.subscription : null;
        let currentPeriodEnd = null;

        if (!email) break;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;
        }

        await upsertSubscription({
          email,
          customerId,
          subscriptionId,
          status: "active",
          currentPeriodEnd,
        });
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = stripeEvent.data.object;
        const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
        const subscriptionId = subscription.id;
        const status = stripeEvent.type === "customer.subscription.deleted"
          ? "canceled"
          : normalizeStatus(subscription.status);
        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null;

        await db.sql`
          update subscriptions
          set status = ${status},
              stripe_customer_id = coalesce(${customerId}, stripe_customer_id),
              current_period_end = coalesce(${currentPeriodEnd}, current_period_end)
          where stripe_subscription_id = ${subscriptionId}
             or stripe_customer_id = ${customerId}
        `;
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("stripe_webhook_failed", {
      event: stripeEvent,
      error,
    });
    return json(500, { error: "No se pudo procesar el evento." });
  }

  return json(200, { received: true });
};
