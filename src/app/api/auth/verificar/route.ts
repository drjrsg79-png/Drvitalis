import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  consumirTokenAcceso,
  obtenerOcrearUsuarioPorEmail,
  crearSesion,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const rawUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:8889";
  const baseUrl = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }

  try {
    const email = await consumirTokenAcceso(token);
    if (!email) {
      // Token inválido, ya usado, o expirado.
      return NextResponse.redirect(`${baseUrl}/?auth=expirado`);
    }

    const userId = await obtenerOcrearUsuarioPorEmail(email);
    const sessionToken = crypto.randomBytes(32).toString("hex");
    await crearSesion(userId, sessionToken);

    const respuesta = NextResponse.redirect(`${baseUrl}/?auth=ok`);
    respuesta.cookies.set("vitalis_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });
    return respuesta;
  } catch {
    return NextResponse.redirect(`${baseUrl}/?auth=error`);
  }
}
