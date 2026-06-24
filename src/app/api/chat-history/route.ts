import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@db/index";
import { chatHistory } from "@db/schema";

// Toca la base de datos en cada petición: nunca prerenderizar.
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

// GET /api/chat-history?email=...  → la conversación más reciente del paciente.
// Permite que el chat recupere el contexto al volver a entrar.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  try {
    const [fila] = await db
      .select()
      .from(chatHistory)
      .where(eq(chatHistory.email, email))
      .orderBy(desc(chatHistory.createdAt))
      .limit(1);

    const messages = Array.isArray(fila?.messages)
      ? (fila.messages as ChatMessage[])
      : [];

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}

// POST /api/chat-history  → guarda (o actualiza) la conversación del paciente.
// Mantiene una sola fila viva por paciente para no acumular duplicados.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const messages = Array.isArray(body.messages) ? body.messages : null;
    if (!email || !messages) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const [existente] = await db
      .select({ id: chatHistory.id })
      .from(chatHistory)
      .where(eq(chatHistory.email, email))
      .orderBy(desc(chatHistory.createdAt))
      .limit(1);

    if (existente) {
      await db
        .update(chatHistory)
        .set({ messages })
        .where(eq(chatHistory.id, existente.id));
    } else {
      await db.insert(chatHistory).values({ email, messages });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar la conversación." },
      { status: 500 },
    );
  }
}
