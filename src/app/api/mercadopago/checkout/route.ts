import { NextRequest, NextResponse } from "next/server";
import { asegurarSuscripcion, obtenerUsuarioPorSesion, upsertUsuario } from "@/lib/db";
import {
  crearReferenciaExterna,
  mercadoPagoRequest,
  obtenerUrlBase,
  type ProductoMercadoPago,
} from "@/lib/mercadopago";

type PreferenceResponse = { init_point?: string };
type PreapprovalResponse = { init_point?: string };

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, edad, pais, condicion, producto } = await req.json();
    const productoFinal: ProductoMercadoPago = producto === "pro" ? "pro" : "7_dias";
    const sessionToken = req.cookies.get("vitalis_session")?.value;
    let userId: string | null = null;
    let correoFinal = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (sessionToken) {
      const usuarioSesion = await obtenerUsuarioPorSesion(sessionToken);
      if (usuarioSesion) {
        userId = usuarioSesion.id;
        correoFinal = usuarioSesion.email;
      }
    }

    if (!correoFinal) {
      return NextResponse.json({ error: "El correo es obligatorio." }, { status: 400 });
    }

    if (!userId) {
      userId = await upsertUsuario({
        email: correoFinal,
        nombre,
        edad,
        pais,
        condicion,
      });
    }
    await asegurarSuscripcion(userId);

    const baseUrl = obtenerUrlBase();
    const externalReference = crearReferenciaExterna(productoFinal, userId);
    const notificationUrl = `${baseUrl}/api/mercadopago/webhook`;

    if (productoFinal === "pro") {
      const preapproval = await mercadoPagoRequest<PreapprovalResponse>("/preapproval", {
        method: "POST",
        body: JSON.stringify({
          reason: "Vitalis Pro",
          external_reference: externalReference,
          payer_email: correoFinal,
          back_url: `${baseUrl}/?payment=success&product=pro`,
          status: "pending",
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: 300,
            currency_id: "MXN",
          },
        }),
      });

      if (!preapproval.init_point) throw new Error("Mercado Pago no devolvió una URL.");
      return NextResponse.json({ url: preapproval.init_point });
    }

    const preference = await mercadoPagoRequest<PreferenceResponse>("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify({
        items: [
          {
            id: "vitalis-7-dias",
            title: "Vitalis 7 días",
            description: "Acceso Pro-equivalente durante aproximadamente 7 días, sin renovación automática.",
            quantity: 1,
            currency_id: "MXN",
            unit_price: 99,
          },
        ],
        payer: { email: correoFinal, name: nombre || undefined },
        external_reference: externalReference,
        notification_url: notificationUrl,
        back_urls: {
          success: `${baseUrl}/?payment=success&product=7_dias`,
          pending: `${baseUrl}/?payment=pending&product=7_dias`,
          failure: `${baseUrl}/?payment=failure&product=7_dias`,
        },
        auto_return: "approved",
        metadata: { user_id: userId, producto: productoFinal },
      }),
    });

    if (!preference.init_point) throw new Error("Mercado Pago no devolvió una URL.");
    return NextResponse.json({ url: preference.init_point });
  } catch {
    return NextResponse.json(
      { error: "No se pudo crear el pago con Mercado Pago." },
      { status: 500 }
    );
  }
}
