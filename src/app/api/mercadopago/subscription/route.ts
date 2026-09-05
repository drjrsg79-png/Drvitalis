import { NextRequest, NextResponse } from "next/server";
import {
  actualizarEstadoPorMercadoPagoSubscriptionId,
  obtenerMercadoPagoSubscriptionIdPorSesion,
} from "@/lib/db";
import { mercadoPagoRequest } from "@/lib/mercadopago";

export async function DELETE(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get("vitalis_session")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Debe iniciar sesión para cancelar su suscripción." },
        { status: 401 }
      );
    }

    const subscriptionId = await obtenerMercadoPagoSubscriptionIdPorSesion(sessionToken);
    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No encontramos una suscripción mensual asociada a su cuenta." },
        { status: 404 }
      );
    }

    await mercadoPagoRequest(`/preapproval/${encodeURIComponent(subscriptionId)}`, {
      method: "PUT",
      body: JSON.stringify({ status: "cancelled" }),
    });
    await actualizarEstadoPorMercadoPagoSubscriptionId(subscriptionId, "canceled");

    return NextResponse.json({ canceled: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo cancelar la suscripción. Intente de nuevo." },
      { status: 500 }
    );
  }
}
