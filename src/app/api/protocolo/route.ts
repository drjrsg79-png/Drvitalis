import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@db/index";
import { protocolo, users } from "@db/schema";

// Toca la base de datos en cada petición: nunca prerenderizar.
export const dynamic = "force-dynamic";

type Medicamento = {
  nombre: string;
  dosis: string;
  frecuencia: string;
  nota: string;
};

// GET /api/protocolo?email=...  → protocolo guardado del paciente (o vacío).
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  try {
    const [fila] = await db
      .select()
      .from(protocolo)
      .where(eq(protocolo.email, email))
      .limit(1);

    if (!fila) {
      return NextResponse.json({ protocolo: null });
    }

    return NextResponse.json({
      protocolo: {
        medicamentos: Array.isArray(fila.medicamentos) ? fila.medicamentos : [],
        notasMedicas: fila.notasMedicas || "",
        updatedAt: fila.updatedAt,
      },
    });
  } catch {
    return NextResponse.json({ protocolo: null });
  }
}

// Pide al Dr. Vitalis (IA) un borrador de protocolo estructurado en JSON.
async function generarConIA(perfil: {
  nombre: string;
  edad: string;
  pais: string;
  condicion: string;
}): Promise<{ medicamentos: Medicamento[]; notasMedicas: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const baseUrl = (
    process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"
  ).replace(/\/+$/, "");

  const system =
    "Eres el Dr. Vitalis, urólogo especialista en salud sexual masculina. " +
    "Genera un borrador de protocolo orientativo para el paciente. Responde " +
    "EXCLUSIVAMENTE con un objeto JSON válido, sin texto adicional ni markdown, " +
    'con esta forma: {"medicamentos":[{"nombre":"","dosis":"","frecuencia":"","nota":""}],"notasMedicas":""}. ' +
    "Incluye entre 1 y 4 medicamentos o suplementos frecuentes y seguros de primera línea " +
    "acordes a la condición, con dosis y frecuencia habituales de referencia. En notasMedicas " +
    "incluye recomendaciones de estilo de vida y una advertencia de que es orientación de IA " +
    "que debe validar un médico antes de iniciar cualquier tratamiento. Escribe en español. No uses emojis.";

  const userMsg =
    `Paciente: ${perfil.nombre || "no indicado"}, edad ${perfil.edad || "no indicada"}, ` +
    `país ${perfil.pais || "no indicado"}. Motivo de consulta: ${perfil.condicion || "no indicado"}. ` +
    "Genera el protocolo en el formato JSON indicado.";

  try {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: userMsg }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const texto: string = data?.content?.[0]?.text || "";
    const inicio = texto.indexOf("{");
    const fin = texto.lastIndexOf("}");
    if (inicio === -1 || fin === -1) return null;

    const parsed = JSON.parse(texto.slice(inicio, fin + 1));
    const medicamentos: Medicamento[] = Array.isArray(parsed.medicamentos)
      ? parsed.medicamentos.slice(0, 6).map((m: Record<string, unknown>) => ({
          nombre: String(m.nombre || ""),
          dosis: String(m.dosis || ""),
          frecuencia: String(m.frecuencia || ""),
          nota: String(m.nota || ""),
        }))
      : [];

    return {
      medicamentos,
      notasMedicas: String(parsed.notasMedicas || ""),
    };
  } catch {
    return null;
  }
}

// POST /api/protocolo  → genera con IA un protocolo a partir del perfil del
// paciente, lo persiste y lo devuelve. El email identifica al paciente.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Toma el perfil persistido como base (más confiable que el del cliente).
    const [perfilFila] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const perfil = {
      nombre: perfilFila?.nombre || String(body.nombre || ""),
      edad: perfilFila?.edad || String(body.edad || ""),
      pais: perfilFila?.pais || String(body.pais || ""),
      condicion: perfilFila?.condicion || String(body.condicion || ""),
    };

    const generado = await generarConIA(perfil);
    if (!generado) {
      return NextResponse.json(
        { error: "No se pudo generar el protocolo en este momento." },
        { status: 502 },
      );
    }

    const valores = {
      email,
      medicamentos: generado.medicamentos,
      notasMedicas: generado.notasMedicas,
      updatedAt: new Date(),
    };

    await db
      .insert(protocolo)
      .values(valores)
      .onConflictDoUpdate({ target: protocolo.email, set: valores });

    return NextResponse.json({
      protocolo: {
        medicamentos: generado.medicamentos,
        notasMedicas: generado.notasMedicas,
        updatedAt: valores.updatedAt,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo generar el protocolo." },
      { status: 500 },
    );
  }
}
