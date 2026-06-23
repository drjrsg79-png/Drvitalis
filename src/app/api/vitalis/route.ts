import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Zero-config: en Netlify, AI Gateway inyecta ANTHROPIC_API_KEY y
// ANTHROPIC_BASE_URL automáticamente, por lo que no es necesario gestionar
// claves manualmente. El SDK las detecta solo.
const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages es requerido y debe ser un arreglo" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt || "",
      messages: messages,
    });

    const text = response.content
      .map((c: any) => (c.type === "text" ? c.text : ""))
      .join("");

    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error("Error en /api/vitalis:", err?.message);
    return NextResponse.json(
      { error: "No se pudo obtener respuesta del Dr. Vitalis." },
      { status: 500 }
    );
  }
}
