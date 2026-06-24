import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte } from "drizzle-orm";
import { db } from "@db/index";
import { adherencia } from "@db/schema";

// Toca la base de datos en cada petición: nunca prerenderizar.
export const dynamic = "force-dynamic";

// Devuelve la fecha de hoy en formato YYYY-MM-DD (zona del servidor).
function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

// Fecha de hace n días en formato YYYY-MM-DD.
function hace(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

// GET /api/adherencia?email=...  → registro de hoy y los últimos 7 días.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  try {
    const filas = await db
      .select()
      .from(adherencia)
      .where(
        and(eq(adherencia.email, email), gte(adherencia.fecha, hace(6))),
      );

    const deHoy = filas.find((f) => f.fecha === hoy());
    const dias = filas
      .map((f) => ({
        fecha: f.fecha,
        ejercicios: f.ejerciciosCompletados || 0,
        dosis: f.dosisTomadas || 0,
      }))
      .sort((a, b) => (a.fecha! < b.fecha! ? -1 : 1));

    return NextResponse.json({
      hoy: {
        ejercicios: deHoy?.ejerciciosCompletados || 0,
        dosis: deHoy?.dosisTomadas || 0,
      },
      semana: dias,
    });
  } catch {
    return NextResponse.json({ hoy: { ejercicios: 0, dosis: 0 }, semana: [] });
  }
}

// POST /api/adherencia  → fija los conteos del día de hoy para el paciente.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const ejercicios = Math.max(0, Number(body.ejercicios) || 0);
    const dosis = Math.max(0, Number(body.dosis) || 0);
    const fecha = hoy();

    const valores = {
      email,
      fecha,
      ejerciciosCompletados: ejercicios,
      dosisTomadas: dosis,
    };

    await db
      .insert(adherencia)
      .values(valores)
      .onConflictDoUpdate({
        target: [adherencia.email, adherencia.fecha],
        set: { ejerciciosCompletados: ejercicios, dosisTomadas: dosis },
      });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar la adherencia." },
      { status: 500 },
    );
  }
}
