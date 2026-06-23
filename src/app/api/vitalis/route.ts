import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, messages } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { reply: 'Error: API key no configurada' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-20250514',
        max_tokens: 1024,
        system: systemPrompt || '',
        messages: messages,
      }),
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sin respuesta';

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Error en /api/vitalis:', error?.message);
    return NextResponse.json(
      { reply: 'Error de conexión con Dr. Vitalis' },
      { status: 500 }
    );
  }
}
