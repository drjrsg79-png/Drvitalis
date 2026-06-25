import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { upsertUsuario, asegurarSuscripcion, obtenerUsuarioPorSesion } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, edad, pais, condicion } = await req.json();
    const rawUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:8889";
    // Stripe exige URLs absolutas con esquema. NEXT_PUBLIC_URL puede venir como
    // "drvitalis1.com" sin protocolo, así que se normaliza.
    const baseUrl = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

    // Si el usuario ya tiene una sesión activa (inició sesión previamente),
    // se usa su cuenta real en vez de crear un usuario nuevo a partir del
    // correo escrito en el formulario — evita duplicados si escribió un
    // correo distinto al de su sesión.
    const sessionToken = req.cookies.get("vitalis_session")?.value;
    let userId: string | null = null;
    let correoFinal: string | undefined = email || undefined;

    if (sessionToken) {
      try {
        const usuarioSesion = await obtenerUsuarioPorSesion(sessionToken);
        if (usuarioSesion) {
          userId = usuarioSesion.id;
          correoFinal = usuarioSesion.email;
        }
      } catch {
        // Si falla la consulta de sesión, se continúa con el flujo normal
        // por correo del formulario, sin bloquear el pago.
      }
    }

    // Se persiste el perfil y se reserva su suscripción antes de cobrar.
    // Si la base de datos no estuviera disponible, el pago no se bloquea:
    // el webhook vuelve a vincular la suscripción cuando Stripe confirma.
    if (!userId && correoFinal) {
      try {
        userId = await upsertUsuario({ email: correoFinal, nombre, edad, pais, condicion });
      } catch {
        userId = null;
      }
    }
    if (userId) {
      try {
        await asegurarSuscripcion(userId);
      } catch {
        // No bloquea el pago: el webhook puede crear la fila si falta.
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: correoFinal,
      client_reference_id: userId || undefined,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: "Vitalis Pro — Consulta médica mensual",
              description: "Dr. Vitalis: orientación clínica, ejercicios terapéuticos y seguimiento de tu progreso.",
            },
            unit_amount: 59900,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/?success=true`,
      cancel_url: `${baseUrl}/`,
      metadata: { nombre: nombre || "", user_id: userId || "" },
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear la sesión de pago." },
      { status: 500 }
    );
  }
}
