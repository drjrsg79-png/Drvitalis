import { NextRequest, NextResponse } from "next/server";
import { obtenerUsuarioPorSesion } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionToken = req.cookies.get("vitalis_session")?.value;

  if (!sessionToken) {
    return NextResponse.json({ autenticado: false });
  }

  try {
    const usuario = await obtenerUsuarioPorSesion(sessionToken);
    if (!usuario) {
      // Sesión expirada o inválida: se limpia la cookie para no seguir
      // intentando en cada carga de página.
      const respuesta = NextResponse.json({ autenticado: false });
      respuesta.cookies.set("vitalis_session", "", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return respuesta;
    }
    return NextResponse.json({ autenticado: true, usuario });
  } catch {
    return NextResponse.json({ autenticado: false });
  }
}
