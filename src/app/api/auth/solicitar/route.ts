import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  obtenerOcrearUsuarioPorEmail,
  crearTokenAcceso,
  solicitudRecienteParaCorreo,
} from "@/lib/db";

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email || !emailValido(email)) {
      return NextResponse.json(
        { error: "Ingrese un correo válido." },
        { status: 400 }
      );
    }

    const correo = email.trim().toLowerCase();

    // Límite simple para evitar spam: no se genera otro enlace para el mismo
    // correo si ya se pidió uno en los últimos 60 segundos.
    try {
      const reciente = await solicitudRecienteParaCorreo(correo);
      if (reciente) {
        return NextResponse.json(
          { error: "Ya enviamos un enlace recientemente. Revise su correo o espere un minuto." },
          { status: 429 }
        );
      }
    } catch {
      // Si falla la verificación, se continúa: es mejor permitir el envío
      // que bloquear el acceso por un error transitorio de base de datos.
    }

    // Se crea (o reutiliza) el usuario y se genera un token de un solo uso.
    await obtenerOcrearUsuarioPorEmail(correo);
    const token = crypto.randomBytes(32).toString("hex");
    await crearTokenAcceso(correo, token);

    const rawUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:8889";
    const baseUrl = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const enlace = `${baseUrl}/api/auth/verificar?token=${token}`;

    const sendgridKey = process.env.SENDGRID_API_KEY;
    const remitente = process.env.SENDGRID_FROM_EMAIL || "noreply@drvitalis1.com";

    if (!sendgridKey) {
      // Si no hay proveedor de correo configurado, no se bloquea el flujo en
      // desarrollo: se informa el error para que quede claro en producción.
      return NextResponse.json(
        { error: "El envío de correo no está configurado todavía." },
        { status: 500 }
      );
    }

    const respuesta = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: correo }] }],
        from: { email: remitente, name: "Vitalis" },
        subject: "Su enlace de acceso a Vitalis",
        content: [
          {
            type: "text/html",
            value: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2 style="color:#1B1B1D;">Su enlace de acceso</h2>
                <p style="color:#2E2E30; font-size:15px; line-height:1.5;">
                  Toque el siguiente botón para entrar a su cuenta de Vitalis.
                  Este enlace es válido durante 15 minutos y solo puede usarse una vez.
                </p>
                <p style="text-align:center; margin: 28px 0;">
                  <a href="${enlace}"
                     style="background:#B8922A; color:#fff; padding:14px 28px;
                            border-radius:999px; text-decoration:none; font-weight:700;">
                    Entrar a Vitalis
                  </a>
                </p>
                <p style="color:#7A7670; font-size:13px;">
                  Si usted no solicitó este enlace, puede ignorar este correo.
                </p>
              </div>
            `,
          },
        ],
      }),
    });

    if (!respuesta.ok) {
      return NextResponse.json(
        { error: "No se pudo enviar el correo. Intente de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Ocurrió un error al solicitar el acceso." },
      { status: 500 }
    );
  }
}
