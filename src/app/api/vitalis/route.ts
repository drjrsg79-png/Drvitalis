import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: NextRequest) {
  try {
    const { systemPrompt, messages, stream } = (await request.json()) as {
      systemPrompt?: string;
      messages?: ChatMessage[];
      stream?: boolean;
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

    const payload = {
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt || '',
      messages: sanitized,
    };

    // Modo streaming: la respuesta llega token a token y se reenvía al cliente
    // como texto plano para que el chat la muestre en vivo.
    if (stream) {
      const upstream = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ ...payload, stream: true }),
      });

      if (!upstream.ok || !upstream.body) {
        return NextResponse.json(
          { reply: 'El Dr. Vitalis no está disponible en este momento. Intente de nuevo en unos segundos.' },
          { status: 502 }
        );
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const salida = new ReadableStream<Uint8Array>({
        async start(controller) {
          let buffer = '';
          try {
            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lineas = buffer.split('\n');
              buffer = lineas.pop() || '';
              for (const linea of lineas) {
                const t = linea.trim();
                if (!t.startsWith('data:')) continue;
                const json = t.slice(5).trim();
                if (!json || json === '[DONE]') continue;
                try {
                  const evt = JSON.parse(json);
                  if (
                    evt.type === 'content_block_delta' &&
                    evt.delta?.type === 'text_delta' &&
                    typeof evt.delta.text === 'string'
                  ) {
                    controller.enqueue(encoder.encode(evt.delta.text));
                  }
                } catch {
                  // Fragmento incompleto: se ignora y se espera al siguiente.
                }
              }
            }
          } catch {
            // Si el upstream se corta, cerramos limpiamente lo recibido.
          } finally {
            controller.close();
          }
        },
      });

      return new Response(salida, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      });
    }

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
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
