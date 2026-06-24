import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { subscriptions } from "@db/schema";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// POST /api/stripe/portal  → crea una sesión del portal de facturación de Stripe
// para que el paciente gestione o cancele su suscripción sin contactar soporte.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const correo = String(email || "").trim().toLowerCase();
    if (!correo) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const [sub] = await db
      .select({ customerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.email, correo))
      .limit(1);

    if (!sub?.customerId) {
      return NextResponse.json(
        { error: "No se encontró una suscripción para gestionar." },
        { status: 404 },
      );
    }

    const rawUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:8889";
    const baseUrl = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.customerId,
      return_url: `${baseUrl}/`,
    });

    return NextResponse.json({ url: portal.url });
  } catch {
    return NextResponse.json(
      { error: "No se pudo abrir el portal de facturación." },
      { status: 500 },
    );
  }
}
