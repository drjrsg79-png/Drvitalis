import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { subscriptions, users } from "@db/schema";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

// Inserta o actualiza la suscripción del paciente, identificada por su email.
async function guardarSuscripcion(
  email: string,
  datos: {
    status: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodEnd?: Date | null;
    cancelAtPeriodEnd?: boolean;
  },
) {
  const correo = email.trim().toLowerCase();

  const valores = {
    email: correo,
    status: datos.status,
    stripeCustomerId: datos.stripeCustomerId ?? null,
    stripeSubscriptionId: datos.stripeSubscriptionId ?? null,
    currentPeriodEnd: datos.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: datos.cancelAtPeriodEnd ?? false,
    updatedAt: new Date(),
  };

  await db
    .insert(subscriptions)
    .values(valores)
    .onConflictDoUpdate({ target: subscriptions.email, set: valores });

  // Garantiza que exista una fila de usuario para enlazar el perfil más tarde.
  await db
    .insert(users)
    .values({ email: correo })
    .onConflictDoNothing({ target: users.email });
}

// Localiza el email del cliente a partir de un id de suscripción de Stripe,
// para los eventos que no traen el email directamente.
async function emailDeSuscripcion(subId: string): Promise<string | null> {
  const [fila] = await db
    .select({ email: subscriptions.email })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subId))
    .limit(1);
  return fila?.email ?? null;
}

// Convierte el periodo de fin de Stripe (segundos Unix) a Date.
function aFecha(segundos: number | null | undefined): Date | null {
  return typeof segundos === "number" ? new Date(segundos * 1000) : null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Pago confirmado: se activa la suscripción del paciente.
        const session = event.data.object as Stripe.Checkout.Session;
        const email =
          session.customer_details?.email || session.customer_email || "";
        const subId =
          typeof session.subscription === "string" ? session.subscription : null;

        // Recupera la suscripción para conocer hasta cuándo tiene acceso.
        let periodoFin: Date | null = null;
        if (subId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subId);
            periodoFin = aFecha(
              (sub as unknown as { current_period_end?: number })
                .current_period_end,
            );
          } catch {
            // Si falla la recuperación, se activa igualmente sin fecha de fin.
          }
        }

        if (email) {
          await guardarSuscripcion(email, {
            status: "active",
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : null,
            stripeSubscriptionId: subId,
            currentPeriodEnd: periodoFin,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        // Cambios de estado de la suscripción (reactivación, pausa, programación
        // de cancelación, cambio de plan): se reflejan para mantener el acceso
        // siempre sincronizado con Stripe.
        const sub = event.data.object as Stripe.Subscription;
        const email = await emailDeSuscripcion(sub.id);
        if (email) {
          await guardarSuscripcion(email, {
            status: sub.status,
            stripeCustomerId:
              typeof sub.customer === "string" ? sub.customer : null,
            stripeSubscriptionId: sub.id,
            currentPeriodEnd: aFecha(
              (sub as unknown as { current_period_end?: number })
                .current_period_end,
            ),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        // Suscripción cancelada: se marca como inactiva.
        const sub = event.data.object as Stripe.Subscription;
        const email = await emailDeSuscripcion(sub.id);
        if (email) {
          await guardarSuscripcion(email, {
            status: "canceled",
            stripeSubscriptionId: sub.id,
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        // Cobro recurrente fallido: se restringe el acceso.
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : null;
        const email = invoice.customer_email
          ? invoice.customer_email
          : subId
            ? await emailDeSuscripcion(subId)
            : null;
        if (email) {
          await guardarSuscripcion(email, {
            status: "past_due",
            stripeSubscriptionId: subId,
          });
        }
        break;
      }
      default:
        break;
    }
  } catch {
    // No exponemos detalles; Stripe reintentará si devolvemos un error.
    return NextResponse.json(
      { error: "Error al procesar el evento" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
