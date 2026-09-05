import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  activarAccesoSieteDias,
  activarVitalisPro,
  actualizarEstadoMercadoPagoPorUsuario,
  actualizarEstadoPorMercadoPagoSubscriptionId,
} from "@/lib/db";
import { leerReferenciaExterna, mercadoPagoRequest } from "@/lib/mercadopago";

type WebhookBody = {
  type?: string;
  topic?: string;
  data?: { id?: string | number };
};

type MercadoPagoPayment = {
  id: number;
  status: string;
  external_reference?: string | null;
  payer?: { id?: string | number | null };
};

type MercadoPagoPreapproval = {
  id: string;
  status: string;
  external_reference?: string | null;
  payer_id?: string | number | null;
};

type MercadoPagoAuthorizedPayment = {
  id: number;
  preapproval_id: string;
  external_reference?: string | number | null;
  payment?: { id?: number; status?: string };
};

function firmaValida(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!secret || !signature || !requestId || !dataId) return false;

  const partes = Object.fromEntries(
    signature.split(",").map((parte) => {
      const [clave, ...valor] = parte.trim().split("=");
      return [clave, valor.join("=")];
    })
  );
  const timestamp = partes.ts;
  const firmaRecibida = partes.v1;
  if (!timestamp || !firmaRecibida) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const firmaEsperada = createHmac("sha256", secret).update(manifest).digest("hex");
  const recibida = Buffer.from(firmaRecibida, "utf8");
  const esperada = Buffer.from(firmaEsperada, "utf8");
  return recibida.length === esperada.length && timingSafeEqual(recibida, esperada);
}

export async function POST(req: NextRequest) {
  let body: WebhookBody;
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "Notificación inválida." }, { status: 400 });
  }

  const url = new URL(req.url);
  const dataId = String(
    url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      body.data?.id ||
      ""
  );
  if (!firmaValida(req, dataId)) {
    return NextResponse.json({ error: "Firma inválida." }, { status: 401 });
  }

  const tipo = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic");

  try {
    if (tipo === "payment") {
      const payment = await mercadoPagoRequest<MercadoPagoPayment>(
        `/v1/payments/${encodeURIComponent(dataId)}`
      );
      const referencia = leerReferenciaExterna(payment.external_reference);
      if (referencia?.producto === "7_dias" && payment.status === "approved") {
        await activarAccesoSieteDias(
          referencia.userId,
          String(payment.id),
          payment.payer?.id ? String(payment.payer.id) : null
        );
      } else if (referencia?.producto === "pro") {
        if (payment.status === "approved") {
          await activarVitalisPro(
            referencia.userId,
            null,
            payment.payer?.id ? String(payment.payer.id) : null,
            String(payment.id)
          );
        } else if (payment.status === "rejected" || payment.status === "cancelled") {
          await actualizarEstadoMercadoPagoPorUsuario(referencia.userId, "past_due");
        }
      }
    }

    if (tipo === "subscription_preapproval" || tipo === "preapproval") {
      const preapproval = await mercadoPagoRequest<MercadoPagoPreapproval>(
        `/preapproval/${encodeURIComponent(dataId)}`
      );
      const referencia = leerReferenciaExterna(preapproval.external_reference);
      if (referencia?.producto === "pro") {
        if (preapproval.status === "authorized") {
          await activarVitalisPro(
            referencia.userId,
            preapproval.id,
            preapproval.payer_id ? String(preapproval.payer_id) : null
          );
        } else {
          const estado = preapproval.status === "cancelled" ? "canceled" : preapproval.status;
          await actualizarEstadoPorMercadoPagoSubscriptionId(preapproval.id, estado);
        }
      }
    }

    if (tipo === "subscription_authorized_payment") {
      const authorizedPayment = await mercadoPagoRequest<MercadoPagoAuthorizedPayment>(
        `/authorized_payments/${encodeURIComponent(dataId)}`
      );
      const referencia = leerReferenciaExterna(
        authorizedPayment.external_reference
          ? String(authorizedPayment.external_reference)
          : null
      );
      const paymentStatus = authorizedPayment.payment?.status;

      if (paymentStatus === "approved") {
        if (referencia?.producto === "pro") {
          await activarVitalisPro(
            referencia.userId,
            authorizedPayment.preapproval_id,
            null,
            authorizedPayment.payment?.id
              ? String(authorizedPayment.payment.id)
              : null
          );
        } else {
          await actualizarEstadoPorMercadoPagoSubscriptionId(
            authorizedPayment.preapproval_id,
            "active"
          );
        }
      } else if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
        await actualizarEstadoPorMercadoPagoSubscriptionId(
          authorizedPayment.preapproval_id,
          "past_due"
        );
      }
    }
  } catch {
    return NextResponse.json(
      { error: "No se pudo procesar la notificación." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
