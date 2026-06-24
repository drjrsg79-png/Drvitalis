import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { users, subscriptions } from "@db/schema";

// Estas rutas tocan la base de datos en cada petición: nunca deben prerenderizarse.
export const dynamic = "force-dynamic";

// Estados de Stripe que dan acceso a Vitalis Pro.
const ESTADOS_ACTIVOS = ["active", "trialing"];

// GET /api/account?email=...  → perfil guardado y si la suscripción está activa.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  try {
    const [perfil] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.email, email))
      .limit(1);

    const subscribed = !!sub && ESTADOS_ACTIVOS.includes(sub.status || "");

    return NextResponse.json({
      profile: perfil
        ? {
            nombre: perfil.nombre || "",
            email: perfil.email,
            edad: perfil.edad || "",
            pais: perfil.pais || "",
            condicion: perfil.condicion || "",
          }
        : null,
      subscribed,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer la cuenta." },
      { status: 500 },
    );
  }
}

// POST /api/account  → guarda (o actualiza) el perfil médico del paciente.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const valores = {
      identityId: body.identityId ? String(body.identityId) : null,
      email,
      nombre: body.nombre ? String(body.nombre) : null,
      edad: body.edad ? String(body.edad) : null,
      pais: body.pais ? String(body.pais) : null,
      condicion: body.condicion ? String(body.condicion) : null,
      onboardingCompleto: true,
      updatedAt: new Date(),
    };

    await db
      .insert(users)
      .values(valores)
      .onConflictDoUpdate({ target: users.email, set: valores });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar el perfil." },
      { status: 500 },
    );
  }
}
