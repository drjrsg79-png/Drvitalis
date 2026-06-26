import { NextRequest, NextResponse } from "next/server";
import { obtenerOcrearUsuarioPorEmail, asegurarSuscripcion, activarSuscripcion } from "@/lib/db";

// ENDPOINT TEMPORAL — borrar después de usarlo una sola vez.
// Corrige manualmente la suscripción de drjrsg79@gmail.com, cuyo pago se
// completó en Stripe (24 jun 2026) antes de que existiera el webhook que
// lo hubiera activado automáticamente en la base de datos.
export async function POST(req: NextRequest) {
  const clave = req.nextUrl.searchParams.get("clave");
  if (clave !== "vitalis-fix-2026") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const email = "drjrsg79@gmail.com";
    const stripeCustomerId = "cus_UIV2OURgD72uI7";
    const stripeSubscriptionId = "sub_1Tly2f4i3LPLUS7e98aP0MYE";

    const userId = await obtenerOcrearUsuarioPorEmail(email);
    await asegurarSuscripcion(userId);
    await activarSuscripcion(userId, stripeCustomerId, stripeSubscriptionId);

    return NextResponse.json({ ok: true, userId, email });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo activar la suscripción.", detalle: String(err) },
      { status: 500 }
    );
  }
}
