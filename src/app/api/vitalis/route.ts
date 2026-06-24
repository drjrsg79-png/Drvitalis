import { NextRequest, NextResponse } from 'next/server';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, messages } = (await request.json()) as {
      systemPrompt?: string;
      messages?: ChatMessage[];
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { reply: 'El servicio no está configurado correctamente. Intente más tarde.' },
        { status: 500 }
      );
    }

    // En Netlify, la inferencia se enruta por el AI Gateway: ANTHROPIC_BASE_URL y
    // ANTHROPIC_API_KEY se inyectan automáticamente. Si no estuvieran (p. ej. en
    // local sin gateway), se cae a la API pública de Anthropic.
    const baseUrl = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/+$/, '');

    // La API de Anthropic exige que la conversación empiece con un turno del
    // usuario. El saludo inicial del Dr. Vitalis es un mensaje "assistant", así
    // que se descartan los mensajes de assistant que aparezcan antes del primer
    // mensaje del usuario.
    const conversation = Array.isArray(messages) ? messages : [];
    const firstUser = conversation.findIndex((m) => m.role === 'user');
    const sanitized = firstUser === -1 ? [] : conversation.slice(firstUser);

    if (sanitized.length === 0) {
      return NextResponse.json(
        { reply: 'No se recibió ninguna consulta.' },
        { status: 400 }
      );
    }

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: systemPrompt || '',
        messages: sanitized,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { reply: 'El Dr. Vitalis no está disponible en este momento. Intente de nuevo en unos segundos.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply: string =
      data?.content?.[0]?.text ||
      'Disculpe, no pude formular una respuesta. ¿Podría reformular su consulta?';

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { reply: 'Error de conexión con Dr. Vitalis. Intente nuevamente.' },
      { status: 500 }
    );
  }
}
