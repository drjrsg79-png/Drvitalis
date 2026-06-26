import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { obtenerStripeCustomerIdPorSesion } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("vitalis_session")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Debe iniciar sesión para administrar su suscripción." },
        { status: 401 }
      );
    }

    const customerId = await obtenerStripeCustomerIdPorSesion(sessionToken);
    if (!customerId) {
      return NextResponse.json(
        { error: "No encontramos una suscripción asociada a su cuenta." },
        { status: 404 }
      );
    }

    const rawUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:8889";
    const baseUrl = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/?portal=ok`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch {
    return NextResponse.json(
      { error: "No se pudo abrir el portal de administración. Intente de nuevo." },
      { status: 500 }
    );
  }
}
