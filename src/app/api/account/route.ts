import { NextRequest, NextResponse } from "next/server";
import { obtenerCuentaPorEmail } from "@/lib/db";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim();

  if (!email) {
    return NextResponse.json({ account: null }, { status: 400 });
  }

  try {
    const account = await obtenerCuentaPorEmail(email);
    return NextResponse.json({ account });
  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar la cuenta." },
      { status: 500 }
    );
  }
}
