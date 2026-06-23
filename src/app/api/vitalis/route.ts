import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
      model: "claude-opus-4-20250514",
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
