import Stripe from "stripe";
import {
  normalizarEmail,
  upsertSuscripcionActivaPorEmail,
  verifyProAccess,
} from "../../src/lib/db";

const PRO_STATUSES = new Set(["active", "trialing"]);

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

async function syncFromStripe(email: string) {
  if (!process.env.STRIPE_SECRET_KEY) return null;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const customers = await stripe.customers.list({ email, limit: 10 });

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });
    const active = subscriptions.data.find((subscription) =>
      PRO_STATUSES.has(subscription.status)
    );

    if (active) {
      const currentPeriodEnd = active.current_period_end
        ? new Date(active.current_period_end * 1000)
        : null;
      const plan =
        active.items.data[0]?.price.nickname ||
        active.items.data[0]?.price.lookup_key ||
        "pro";

      await upsertSuscripcionActivaPorEmail({
        email,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: active.id,
        status: active.status,
        plan,
        currentPeriodEnd,
      });

      return verifyProAccess(email);
    }
  }

  return null;
}

function sessionCookie(email: string) {
  const secure = process.env.CONTEXT === "production" ? " Secure;" : "";
  const maxAge = 60 * 60 * 24 * 30;
  const encodedEmail = Buffer.from(email, "utf8").toString("base64url");
  return `vitalis_pro=${encodedEmail}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax;${secure}`;
}

export default async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Método no permitido" }, 405, { Allow: "POST" });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = normalizarEmail(body?.email || "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ isPro: false, status: "invalid_email" }, 400);
    }

    let access = await verifyProAccess(email);
    if (!access.isPro) {
      access = (await syncFromStripe(email)) || access;
    }

    if (!access.isPro) {
      return json({ isPro: false, status: "not_found", plan: null, renewalDate: null });
    }

    return json(
      {
        isPro: true,
        status: access.status,
        plan: access.plan,
        renewalDate: access.renewalDate,
      },
      200,
      { "Set-Cookie": sessionCookie(access.email) }
    );
  } catch {
    return json(
      { isPro: false, status: "error", plan: null, renewalDate: null },
      500
    );
  }
};
