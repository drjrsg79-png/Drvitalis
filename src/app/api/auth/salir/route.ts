import { NextRequest, NextResponse } from "next/server";
import { eliminarSesion } from "@/lib/db";

export async function POST(req: NextRequest) {
  const sessionToken = req.cookies.get("vitalis_session")?.value;

  if (sessionToken) {
    try {
      await eliminarSesion(sessionToken);
    } catch {
      // Si falla la eliminación en base de datos, igual se borra la cookie
      // del navegador para que el usuario quede desconectado de inmediato.
    }
  }

  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set("vitalis_session", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return respuesta;
}
