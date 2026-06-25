import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import {
  activarSuscripcion,
  asegurarSuscripcion,
  obtenerAccesoPorEmail,
  upsertUsuario,
} from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { email, nombre, edad, pais, condicion } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedEmail) {
      return NextResponse.json({ active: false }, { status: 400 });
    }

    const acceso = await obtenerAccesoPorEmail(normalizedEmail);
    if (acceso.activo) {
      return NextResponse.json({ active: true, nombre: acceso.nombre });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ active: false });
    }

    const customers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 5,
      expand: ["data.subscriptions"],
    });

    const customer = customers.data.find((item) =>
      item.subscriptions?.data.some((sub) => ["active", "trialing"].includes(sub.status))
    );
    const subscription = customer?.subscriptions?.data.find((sub) =>
      ["active", "trialing"].includes(sub.status)
    );

    if (!customer || !subscription) {
      return NextResponse.json({ active: false });
    }

    const userId = acceso.userId || await upsertUsuario({
      email: normalizedEmail,
      nombre: nombre || customer.name || "",
      edad,
      pais,
      condicion,
    });
    await asegurarSuscripcion(userId);
    await activarSuscripcion(userId, customer.id, subscription.id);

    return NextResponse.json({ active: true, nombre: acceso.nombre || customer.name || null });
  } catch {
    return NextResponse.json(
      { active: false, error: "No se pudo verificar el acceso." },
      { status: 500 }
    );
  }
}
