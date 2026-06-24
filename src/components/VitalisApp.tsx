'use client';
import { useState, useRef, useEffect, useCallback } from "react";
import {
  login,
  signup,
  logout,
  getUser,
  handleAuthCallback,
  AuthError,
  MissingIdentityError,
} from "@netlify/identity";

const T = {
  cream: "#FAF8F5",
  charcoal: "#1C1C1E",
  gold: "#B8922A",
  goldDark: "#9A7A1F",
  white: "#FFFFFF",
  ink: "#2E2E30",
  border: "#DDD8CE",
  muted: "#7A7670",
  teal: "#2D7D6F",
  danger: "#B23A2A",
};

type Perfil = {
  nombre: string;
  email: string;
  edad: string;
  pais: string;
  condicion: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

type Medicamento = {
  nombre: string;
  dosis: string;
  frecuencia: string;
  nota: string;
};

type ProtocoloData = {
  medicamentos: Medicamento[];
  notasMedicas: string;
  updatedAt?: string;
};

type Adherencia = { ejercicios: number; dosis: number };
type DiaAdherencia = { fecha: string; ejercicios: number; dosis: number };

const PRECIO = "$599 MXN";
const PERFIL_VACIO: Perfil = { nombre: "", email: "", edad: "", pais: "", condicion: "" };

// Motivos de consulta frecuentes para guiar el onboarding (además de texto libre).
const CONDICIONES = [
  "Disfunción eréctil",
  "Eyaculación precoz",
  "Bajo deseo sexual (libido)",
  "Salud prostática",
  "Fertilidad",
  "Otro / prefiero describirlo",
];

// Instrucción de seguridad clínica que se añade al Dr. Vitalis: orientación de
// IA, no sustituye atención presencial y deriva ante señales de alarma.
const SEGURIDAD =
  "Eres orientación de salud con inteligencia artificial y no sustituyes una consulta " +
  "médica presencial ni una urgencia. Ante señales de alarma (dolor agudo, sangrado, " +
  "fiebre alta, ideas de autolesión u otros síntomas graves) indica al paciente buscar " +
  "atención presencial inmediata. No emitas diagnósticos definitivos; ofrece orientación " +
  "y recomienda validación con un médico.";

// Protocolo de ejercicios urológicos guiados. Cada ejercicio se reproduce dentro
// de la app en un modal con la marca Vitalis. El campo videoEmbed acepta una URL
// embebible (YouTube/Vimeo "embed", o un MP4 propio); déjalo vacío para mostrar
// el estado "video guiado en preparación" hasta cargar el video definitivo de la
// clínica. Ya no se envía al paciente a búsquedas externas de YouTube.
type Ejercicio = {
  id: string;
  nombre: string;
  objetivo: string;
  frecuencia: string;
  descripcion: string;
  videoEmbed: string;
};

const EJERCICIOS: Ejercicio[] = [
  {
    id: "kegel-base",
    nombre: "Kegel de base",
    objetivo: "Fortalecer el suelo pélvico",
    frecuencia: "3 series de 10, 2 veces al día",
    descripcion:
      "Identifica los músculos del suelo pélvico (los que cortan el flujo de orina) y contráelos durante 5 segundos, luego relaja 5 segundos. Mantén el abdomen y los glúteos relajados.",
    videoEmbed: "",
  },
  {
    id: "contracciones-rapidas",
    nombre: "Contracciones rápidas",
    objetivo: "Mejorar el control eyaculatorio",
    frecuencia: "3 series de 15, 1 vez al día",
    descripcion:
      "Contrae y relaja el suelo pélvico de forma rápida y rítmica. Este ejercicio entrena la respuesta refleja del músculo y favorece el control durante la actividad sexual.",
    videoEmbed: "",
  },
  {
    id: "kegel-sostenido",
    nombre: "Kegel sostenido",
    objetivo: "Resistencia del suelo pélvico",
    frecuencia: "2 series de 8, 2 veces al día",
    descripcion:
      "Contrae el suelo pélvico y mantén la tensión entre 8 y 10 segundos antes de relajar lentamente. Aumenta la fuerza sostenida que soporta la función eréctil.",
    videoEmbed: "",
  },
  {
    id: "puente-gluteos",
    nombre: "Puente de glúteos",
    objetivo: "Estabilidad de cadera y pelvis",
    frecuencia: "3 series de 12, día por medio",
    descripcion:
      "Acostado boca arriba con las rodillas flexionadas, eleva la cadera contrayendo glúteos y suelo pélvico. Mejora la irrigación de la zona pélvica y el soporte muscular.",
    videoEmbed: "",
  },
  {
    id: "respiracion-diafragmatica",
    nombre: "Respiración diafragmática",
    objetivo: "Relajar y coordinar el suelo pélvico",
    frecuencia: "5 minutos, 1 vez al día",
    descripcion:
      "Respira profundo llevando el aire al abdomen; al inhalar relaja el suelo pélvico y al exhalar contráelo suavemente. Reduce la tensión que afecta el rendimiento sexual.",
    videoEmbed: "",
  },
  {
    id: "estiramiento-flexores",
    nombre: "Estiramiento de flexores de cadera",
    objetivo: "Liberar tensión pélvica",
    frecuencia: "30 segundos por lado, diario",
    descripcion:
      "En posición de zancada, lleva la cadera hacia adelante manteniendo la espalda recta. Libera la tensión del psoas que comprime la zona pélvica y mejora la movilidad.",
    videoEmbed: "",
  },
];

const TOTAL_EJERCICIOS = EJERCICIOS.length;

/* ------------------------------- utilidades ------------------------------- */

async function iniciarCheckout(perfil: Perfil): Promise<string | null> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: perfil.email, nombre: perfil.nombre }),
    });
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

// Consulta a la base de datos el perfil guardado y si la suscripción está activa.
async function cargarCuenta(
  email: string,
): Promise<{ profile: Perfil | null; subscribed: boolean }> {
  try {
    const res = await fetch(`/api/account?email=${encodeURIComponent(email)}`);
    if (!res.ok) return { profile: null, subscribed: false };
    return await res.json();
  } catch {
    return { profile: null, subscribed: false };
  }
}

// Guarda el perfil médico en la base de datos.
async function guardarPerfil(perfil: Perfil, identityId?: string): Promise<void> {
  try {
    await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...perfil, identityId }),
    });
  } catch {
    // El flujo continúa aunque falle el guardado; se reintenta en otra visita.
  }
}

/* ----------------------- renderizado de Markdown ligero ---------------------- */
// Render mínimo y seguro (sin HTML crudo) para que las respuestas del Dr. Vitalis
// muestren negritas, listas y pasos en lugar de texto plano.

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const partes = text.split(/(\*\*[^*]+\*\*)/g);
  return partes.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyBase}-${i}`} style={{ fontWeight: 700 }}>
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyBase}-${i}`}>{p}</span>;
  });
}

const Markdown = ({ text }: { text: string }) => {
  const lineas = text.split("\n");
  const bloques: React.ReactNode[] = [];
  let lista: { tipo: "ul" | "ol"; items: string[] } | null = null;

  const cerrarLista = (k: number) => {
    if (!lista) return;
    const items = lista.items.map((it, i) => (
      <li key={i} style={{ marginBottom: "4px" }}>
        {renderInline(it, `li-${k}-${i}`)}
      </li>
    ));
    bloques.push(
      lista.tipo === "ul" ? (
        <ul key={`ul-${k}`} style={{ margin: "6px 0", paddingLeft: "20px" }}>
          {items}
        </ul>
      ) : (
        <ol key={`ol-${k}`} style={{ margin: "6px 0", paddingLeft: "20px" }}>
          {items}
        </ol>
      ),
    );
    lista = null;
  };

  lineas.forEach((linea, i) => {
    const t = linea.trim();
    const vinieta = /^[-*]\s+(.*)/.exec(t);
    const numerada = /^\d+\.\s+(.*)/.exec(t);
    if (vinieta) {
      if (lista?.tipo !== "ul") cerrarLista(i);
      lista = lista ?? { tipo: "ul", items: [] };
      lista.items.push(vinieta[1]);
    } else if (numerada) {
      if (lista?.tipo !== "ol") cerrarLista(i);
      lista = lista ?? { tipo: "ol", items: [] };
      lista.items.push(numerada[1]);
    } else {
      cerrarLista(i);
      if (t === "") return;
      bloques.push(
        <p key={`p-${i}`} style={{ margin: "0 0 8px" }}>
          {renderInline(t, `p-${i}`)}
        </p>,
      );
    }
  });
  cerrarLista(lineas.length);

  return <div>{bloques}</div>;
};

/* ----------------------------- componentes UI ----------------------------- */

const Header = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", color: T.white, fontWeight: 700, fontSize: "16px" }}>V</div>
    <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.08em", color: T.charcoal }}>VITALIS</span>
  </div>
);

const Landing = ({ onSubscribe, onLogin }: { onSubscribe: () => void; onLogin: () => void }) => (
  <div style={{ minHeight: "100vh", background: T.cream, color: T.ink }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", maxWidth: "1080px", margin: "0 auto" }}>
      <Header />
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button onClick={onLogin} style={{ padding: "9px 16px", background: "transparent", color: T.charcoal, border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Iniciar sesión</button>
        <button onClick={onSubscribe} style={{ padding: "9px 18px", background: T.gold, color: T.white, border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Activar Vitalis Pro</button>
      </div>
    </header>

    {/* Hero */}
    <section style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px 40px", textAlign: "center" }}>
      <div style={{ display: "inline-block", padding: "5px 12px", background: "rgba(45,125,111,0.1)", color: T.teal, borderRadius: "999px", fontSize: "12px", fontWeight: 600, marginBottom: "20px" }}>Salud sexual masculina con inteligencia artificial</div>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 44px)", lineHeight: 1.1, fontWeight: 800, color: T.charcoal, margin: "0 0 18px" }}>Tu urólogo experto, disponible las 24 horas</h1>
      <p style={{ fontSize: "17px", lineHeight: 1.6, color: T.muted, margin: "0 auto 32px", maxWidth: "600px" }}>
        Vitalis es una plataforma de salud sexual masculina guiada por el Dr. Vitalis, un especialista con IA que entiende tu caso, te orienta de forma privada y te acompaña con un protocolo personalizado: medicamentos con dosis, ejercicios terapéuticos guiados y seguimiento de tu progreso.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={onSubscribe} style={{ padding: "14px 30px", background: T.gold, color: T.white, border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Activar Vitalis Pro — {PRECIO}/mes</button>
      </div>
      <p style={{ fontSize: "13px", color: T.muted, marginTop: "16px" }}>Crea tu cuenta, activa el acceso completo al Dr. Vitalis y a tu protocolo. Cancela cuando quieras.</p>
    </section>

    {/* Confianza */}
    <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px 10px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
        {["Privado y confidencial", "Orientación médica especializada", "Cobro discreto en tu estado de cuenta", "Cancela cuando quieras"].map((b) => (
          <span key={b} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", color: T.ink, background: T.white, border: `1px solid ${T.border}`, borderRadius: "999px", padding: "8px 14px" }}>
            <span style={{ color: T.teal, fontWeight: 800 }}>✓</span>{b}
          </span>
        ))}
      </div>
    </section>

    {/* Qué hacemos */}
    <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px 50px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
        {[
          { t: "Consulta privada 24/7", d: "Conversa con el Dr. Vitalis cuando lo necesites. Recuerda tu caso entre sesiones y responde con tono médico profesional, en español." },
          { t: "Protocolo personalizado", d: "Según tu edad, país y condición, recibes un plan con medicamentos, dosis y ejercicios terapéuticos guiados paso a paso." },
          { t: "Seguimiento de adherencia", d: "Lleva el control de ejercicios completados y dosis tomadas, con tu progreso semanal para mejorar resultados con el tiempo." },
        ].map((c) => (
          <div key={c.t} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "24px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: T.gold, marginBottom: "14px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: T.charcoal, margin: "0 0 8px" }}>{c.t}</h3>
            <p style={{ fontSize: "14px", lineHeight: 1.55, color: T.muted, margin: 0 }}>{c.d}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Privacidad y discreción */}
    <section style={{ maxWidth: "820px", margin: "0 auto", padding: "0 24px 50px" }}>
      <div style={{ background: "rgba(45,125,111,0.07)", border: `1px solid ${T.border}`, borderRadius: "14px", padding: "28px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: T.charcoal, margin: "0 0 10px" }}>Tu privacidad es lo primero</h2>
        <p style={{ fontSize: "14px", color: T.ink, lineHeight: 1.6, margin: 0 }}>
          Sabemos lo sensible que es este tema. Tu información se trata de forma confidencial y tu acceso es personal y protegido. El cobro aparece de forma discreta en tu estado de cuenta. Nadie de tu entorno necesita enterarse: Vitalis es solo para ti.
        </p>
      </div>
    </section>

    {/* Cómo funciona */}
    <section style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px 50px" }}>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: T.charcoal, textAlign: "center", margin: "0 0 28px" }}>Cómo funciona</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[
          ["1", "Crea tu cuenta", "Regístrate con tu correo y contraseña para tener un acceso seguro y privado a tu historial."],
          ["2", "Activa tu suscripción", "Completas el pago seguro con Stripe para desbloquear Vitalis Pro."],
          ["3", "Sigue tu protocolo", "Hablas con el Dr. Vitalis, recibes tu protocolo y registras tu progreso día a día."],
        ].map(([n, t, d]) => (
          <div key={n} style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: T.white, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "18px 20px" }}>
            <div style={{ flexShrink: 0, width: "32px", height: "32px", borderRadius: "999px", background: T.charcoal, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px" }}>{n}</div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: T.charcoal, marginBottom: "3px" }}>{t}</div>
              <div style={{ fontSize: "14px", color: T.muted, lineHeight: 1.5 }}>{d}</div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Precio */}
    <section style={{ maxWidth: "480px", margin: "0 auto", padding: "0 24px 50px" }}>
      <div style={{ background: T.white, border: `2px solid ${T.gold}`, borderRadius: "16px", padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: T.teal, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px" }}>Vitalis Pro</div>
        <div style={{ fontSize: "42px", fontWeight: 800, color: T.charcoal }}>{PRECIO}<span style={{ fontSize: "16px", fontWeight: 600, color: T.muted }}> / mes</span></div>
        <p style={{ fontSize: "14px", color: T.muted, margin: "10px 0 22px" }}>Acceso completo al Dr. Vitalis, protocolo personalizado y seguimiento. Cancela cuando quieras.</p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", textAlign: "left", display: "flex", flexDirection: "column", gap: "10px" }}>
          {["Consultas ilimitadas 24/7", "Medicamentos con dosis exactas", "Ejercicios terapéuticos guiados", "Seguimiento de tu progreso"].map((f) => (
            <li key={f} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: T.ink }}>
              <span style={{ color: T.teal, fontWeight: 800 }}>✓</span>{f}
            </li>
          ))}
        </ul>
        <button onClick={onSubscribe} style={{ width: "100%", padding: "15px", background: T.gold, color: T.white, border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Suscribirme</button>
      </div>
    </section>

    {/* Preguntas frecuentes */}
    <section style={{ maxWidth: "760px", margin: "0 auto", padding: "0 24px 50px" }}>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: T.charcoal, textAlign: "center", margin: "0 0 24px" }}>Preguntas frecuentes</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[
          ["¿Qué incluye la suscripción?", "Consultas ilimitadas con el Dr. Vitalis, un protocolo personalizado con medicamentos y dosis de referencia, ejercicios urológicos guiados y el seguimiento de tu adherencia."],
          ["¿Vitalis reemplaza a mi médico?", "No. Vitalis es orientación de salud con inteligencia artificial y no sustituye una consulta médica presencial ni una urgencia. Cualquier tratamiento debe validarlo un profesional."],
          ["¿Cómo se protege mi información?", "Tu cuenta es personal y privada. Tratamos tus datos de forma confidencial y el cobro aparece de forma discreta en tu estado de cuenta."],
          ["¿Cómo cancelo?", "Puedes cancelar cuando quieras desde tu cuenta, a través del portal seguro de facturación. Conservas el acceso hasta el final del periodo pagado."],
        ].map(([q, a]) => (
          <details key={q} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "16px 18px" }}>
            <summary style={{ fontSize: "15px", fontWeight: 700, color: T.charcoal, cursor: "pointer" }}>{q}</summary>
            <p style={{ fontSize: "14px", color: T.muted, lineHeight: 1.6, margin: "10px 0 0" }}>{a}</p>
          </details>
        ))}
      </div>
    </section>

    <footer style={{ borderTop: `1px solid ${T.border}`, padding: "28px 24px", textAlign: "center", fontSize: "12px", color: T.muted, lineHeight: 1.7 }}>
      <p style={{ margin: "0 0 8px", maxWidth: "640px", marginLeft: "auto", marginRight: "auto" }}>
        Vitalis ofrece orientación de salud con inteligencia artificial y no sustituye una consulta médica presencial, un diagnóstico profesional ni la atención de una urgencia. Ante síntomas graves, busca atención médica inmediata.
      </p>
      <p style={{ margin: 0 }}>Vitalis — Salud sexual masculina con IA. Aviso de privacidad y términos disponibles bajo solicitud.</p>
    </footer>
  </div>
);

// Pantalla de autenticación con Netlify Identity (registro e inicio de sesión).
const AuthScreen = ({
  modoInicial,
  onAuthenticated,
  onBack,
}: {
  modoInicial: "login" | "signup";
  onAuthenticated: (email: string, identityId: string) => void;
  onBack: () => void;
}) => {
  const [modo, setModo] = useState<"login" | "signup">(modoInicial);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 600, color: T.ink, marginBottom: "6px" };
  const inputStyle = { width: "100%", padding: "12px", marginBottom: "14px", border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" as const, background: T.white };

  const enviar = async () => {
    setError("");
    setAviso("");
    if (!email.trim() || !password.trim() || (modo === "signup" && !nombre.trim())) {
      setError("Completa todos los campos.");
      return;
    }
    setLoading(true);
    try {
      if (modo === "signup") {
        const user = await signup(email.trim(), password, { full_name: nombre.trim() });
        if (user.confirmedAt) {
          onAuthenticated(user.email || email.trim(), user.id || "");
        } else {
          setAviso("Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.");
          setModo("login");
        }
      } else {
        const user = await login(email.trim(), password);
        onAuthenticated(user.email || email.trim(), user.id || "");
      }
    } catch (e) {
      if (e instanceof MissingIdentityError) {
        setError("La autenticación no está disponible en este entorno. Usa el sitio publicado.");
      } else if (e instanceof AuthError) {
        if (e.status === 401) setError("Correo o contraseña incorrectos.");
        else if (e.status === 403) setError("El registro está cerrado. Contacta al equipo de Vitalis.");
        else if (e.status === 422) setError("Datos inválidos. Revisa el correo y usa una contraseña más segura.");
        else if (e.status === 400) setError("Confirma tu correo antes de iniciar sesión.");
        else setError(e.message);
      } else {
        setError("No se pudo completar la operación. Intenta de nuevo.");
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: T.cream }}>
      <div style={{ maxWidth: "400px", width: "100%" }}>
        <div style={{ marginBottom: "8px" }}><Header /></div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: T.charcoal, margin: "18px 0 6px" }}>
          {modo === "signup" ? "Crea tu cuenta" : "Inicia sesión"}
        </h2>
        <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 24px" }}>
          {modo === "signup"
            ? "Tu acceso a Vitalis es privado y seguro. Con tu cuenta guardamos tu perfil y tu suscripción."
            : "Accede a tu consulta con el Dr. Vitalis y a tu protocolo."}
        </p>

        {modo === "signup" && (
          <>
            <label htmlFor="auth-nombre" style={labelStyle}>Nombre</label>
            <input id="auth-nombre" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
          </>
        )}
        <label htmlFor="auth-email" style={labelStyle}>Correo electrónico</label>
        <input id="auth-email" placeholder="correo@ejemplo.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <label htmlFor="auth-password" style={labelStyle}>Contraseña</label>
        <input id="auth-password" placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") enviar(); }} style={inputStyle} />

        {error && <div style={{ fontSize: "13px", color: T.danger, marginBottom: "12px" }}>{error}</div>}
        {aviso && <div style={{ fontSize: "13px", color: T.teal, marginBottom: "12px" }}>{aviso}</div>}

        <button
          onClick={enviar}
          disabled={loading}
          style={{ width: "100%", padding: "14px", background: loading ? T.border : T.gold, color: T.white, border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer", fontSize: "15px", fontWeight: 700 }}
        >
          {loading ? "Procesando..." : modo === "signup" ? "Crear cuenta" : "Entrar"}
        </button>

        <div style={{ textAlign: "center", marginTop: "18px", fontSize: "13px", color: T.muted }}>
          {modo === "signup" ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button onClick={() => { setModo(modo === "signup" ? "login" : "signup"); setError(""); setAviso(""); }} style={{ background: "none", border: "none", color: T.goldDark, fontWeight: 700, cursor: "pointer", fontSize: "13px", padding: 0 }}>
            {modo === "signup" ? "Inicia sesión" : "Crea una"}
          </button>
        </div>
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: "13px" }}>← Volver al inicio</button>
        </div>
      </div>
    </div>
  );
};

const SuccessBanner = ({ onContinue }: { onContinue: () => void }) => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: T.cream, textAlign: "center" }}>
    <div style={{ width: "56px", height: "56px", borderRadius: "999px", background: T.teal, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>✓</div>
    <h2 style={{ fontSize: "28px", fontWeight: 800, color: T.charcoal, margin: "0 0 12px" }}>Suscripción activada</h2>
    <p style={{ fontSize: "16px", color: T.muted, maxWidth: "440px", margin: "0 0 28px" }}>Gracias por confiar en Vitalis. Tu acceso a Vitalis Pro está activo. Ya puedes iniciar tu consulta con el Dr. Vitalis.</p>
    <button onClick={onContinue} style={{ padding: "14px 30px", background: T.gold, color: T.white, border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Iniciar consulta</button>
  </div>
);

const Onboarding = ({ inicial, subscribed, loading, onComplete }: { inicial: Perfil; subscribed: boolean; loading: boolean; onComplete: (p: Perfil) => void }) => {
  const parteCondicion = CONDICIONES.includes(inicial.condicion) ? inicial.condicion : (inicial.condicion ? "Otro / prefiero describirlo" : "");
  const [form, setForm] = useState<Perfil>(inicial);
  const [condicionSel, setCondicionSel] = useState<string>(parteCondicion);
  const [condicionLibre, setCondicionLibre] = useState<string>(
    CONDICIONES.includes(inicial.condicion) ? "" : inicial.condicion,
  );
  const [consentido, setConsentido] = useState(false);

  const edadNum = Number(form.edad);
  const edadValida = form.edad.trim() === "" || (Number.isFinite(edadNum) && edadNum > 0 && edadNum < 120);
  const condicionFinal = condicionSel === "Otro / prefiero describirlo" ? condicionLibre.trim() : condicionSel;
  const valido = form.nombre.trim() !== "" && form.email.trim() !== "" && edadValida && consentido;

  const labelStyle = { display: "block", fontSize: "12px", fontWeight: 600, color: T.ink, marginBottom: "6px" };
  const inputStyle = { width: "100%", padding: "12px", marginBottom: "14px", border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" as const, background: T.white };

  const continuar = () => {
    if (!valido || loading) return;
    onComplete({ ...form, condicion: condicionFinal });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: T.cream }}>
      <div style={{ maxWidth: "420px", width: "100%" }}>
        <div style={{ marginBottom: "8px" }}><Header /></div>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: T.charcoal, margin: "18px 0 6px" }}>Información personal</h2>
        <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 24px" }}>
          {subscribed
            ? "Confidencial. Nos ayuda a personalizar la orientación del Dr. Vitalis."
            : "Confirma tus datos para activar Vitalis Pro. El cobro se realiza de forma segura con Stripe."}
        </p>

        <label htmlFor="ob-nombre" style={labelStyle}>Nombre</label>
        <input id="ob-nombre" placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />

        <label htmlFor="ob-email" style={labelStyle}>Correo electrónico</label>
        <input id="ob-email" placeholder="Correo electrónico" type="email" value={form.email} readOnly style={{ ...inputStyle, background: "#F2EFEA", color: T.muted }} />

        <label htmlFor="ob-edad" style={labelStyle}>Edad</label>
        <input id="ob-edad" placeholder="Edad" inputMode="numeric" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value.replace(/[^0-9]/g, "") })} style={inputStyle} />

        <label htmlFor="ob-pais" style={labelStyle}>País</label>
        <input id="ob-pais" placeholder="País" value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} style={inputStyle} />

        <label htmlFor="ob-condicion" style={labelStyle}>Motivo de consulta</label>
        <select id="ob-condicion" value={condicionSel} onChange={(e) => setCondicionSel(e.target.value)} style={inputStyle}>
          <option value="">Selecciona una opción</option>
          {CONDICIONES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {condicionSel === "Otro / prefiero describirlo" && (
          <input placeholder="Describe tu motivo de consulta" value={condicionLibre} onChange={(e) => setCondicionLibre(e.target.value)} style={inputStyle} aria-label="Describe tu motivo de consulta" />
        )}

        <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "12px", color: T.muted, lineHeight: 1.5, margin: "4px 0 18px", cursor: "pointer" }}>
          <input type="checkbox" checked={consentido} onChange={(e) => setConsentido(e.target.checked)} style={{ marginTop: "2px" }} />
          <span>Entiendo que el Dr. Vitalis ofrece orientación con inteligencia artificial, que no sustituye una consulta médica presencial ni una urgencia, y acepto el tratamiento confidencial de mis datos.</span>
        </label>

        <button
          onClick={continuar}
          disabled={!valido || loading}
          style={{ width: "100%", padding: "14px", background: valido && !loading ? T.gold : T.border, color: T.white, border: "none", borderRadius: "8px", cursor: valido && !loading ? "pointer" : "not-allowed", fontSize: "15px", fontWeight: 700 }}
        >
          {loading ? "Redirigiendo a pago seguro..." : subscribed ? "Iniciar consulta" : `Continuar al pago — ${PRECIO}/mes`}
        </button>
      </div>
    </div>
  );
};

// Modal reproductor de video in-app (marca Vitalis). Si aún no hay video
// definitivo cargado, muestra un estado claro en lugar de un enlace externo.
const VideoModal = ({ ejercicio, onClose }: { ejercicio: Ejercicio; onClose: () => void }) => (
  <div
    onClick={onClose}
    style={{ position: "fixed", inset: 0, background: "rgba(20,20,22,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}
  >
    <div onClick={(e) => e.stopPropagation()} style={{ background: T.white, borderRadius: "14px", maxWidth: "640px", width: "100%", overflow: "hidden", border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "5px", background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", color: T.white, fontWeight: 700, fontSize: "13px" }}>V</div>
          <span style={{ fontSize: "15px", fontWeight: 700, color: T.charcoal }}>{ejercicio.nombre}</span>
        </div>
        <button onClick={onClose} aria-label="Cerrar" style={{ background: "transparent", border: "none", fontSize: "20px", color: T.muted, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>
      <div style={{ aspectRatio: "16 / 9", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {ejercicio.videoEmbed ? (
          <iframe
            src={ejercicio.videoEmbed}
            title={ejercicio.nombre}
            style={{ width: "100%", height: "100%", border: "none" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div style={{ textAlign: "center", color: T.white, padding: "24px" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "8px" }}>Video guiado en preparación</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", maxWidth: "380px" }}>Mientras tanto, sigue la técnica descrita abajo. El video del especialista estará disponible próximamente dentro de la app.</div>
          </div>
        )}
      </div>
      <div style={{ padding: "18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: T.teal, background: "rgba(45,125,111,0.1)", padding: "3px 10px", borderRadius: "999px" }}>{ejercicio.objetivo}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: T.goldDark, background: "rgba(184,146,42,0.12)", padding: "3px 10px", borderRadius: "999px" }}>{ejercicio.frecuencia}</span>
        </div>
        <p style={{ fontSize: "14px", color: T.ink, lineHeight: 1.6, margin: 0 }}>{ejercicio.descripcion}</p>
      </div>
    </div>
  </div>
);

const Ejercicios = ({ onMarcarHecho }: { onMarcarHecho: () => void }) => {
  const [abierto, setAbierto] = useState<Ejercicio | null>(null);

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 24px 60px" }}>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: T.charcoal, margin: "0 0 8px" }}>Ejercicios urológicos guiados</h2>
      <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 28px", lineHeight: 1.6 }}>
        Cada ejercicio incluye su propio video guiado dentro de la app. Sigue la técnica, respeta la frecuencia indicada y marca tu avance para llevar el seguimiento de tu adherencia.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {EJERCICIOS.map((ej, i) => (
          <div key={ej.id} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "999px", background: T.charcoal, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px" }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "17px", fontWeight: 700, color: T.charcoal, margin: "0 0 4px" }}>{ej.nombre}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: T.teal, background: "rgba(45,125,111,0.1)", padding: "3px 10px", borderRadius: "999px" }}>{ej.objetivo}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: T.goldDark, background: "rgba(184,146,42,0.12)", padding: "3px 10px", borderRadius: "999px" }}>{ej.frecuencia}</span>
                </div>
                <p style={{ fontSize: "14px", color: T.muted, lineHeight: 1.55, margin: "0 0 16px" }}>{ej.descripcion}</p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button onClick={() => setAbierto(ej)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: T.gold, color: T.white, border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                    <span style={{ fontSize: "12px" }}>▶</span> Ver video guiado
                  </button>
                  <button onClick={onMarcarHecho} style={{ padding: "10px 18px", background: "transparent", color: T.teal, border: `1px solid ${T.teal}`, borderRadius: "8px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                    Marcar como hecho hoy
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {abierto && <VideoModal ejercicio={abierto} onClose={() => setAbierto(null)} />}
    </div>
  );
};

const ProtocoloView = ({ email, perfil }: { email: string; perfil: Perfil }) => {
  const [data, setData] = useState<ProtocoloData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const res = await fetch(`/api/protocolo?email=${encodeURIComponent(email)}`);
        const json = await res.json();
        if (activo) setData(json.protocolo || null);
      } catch {
        // Sin protocolo guardado: se ofrece generarlo.
      }
      if (activo) setCargando(false);
    })();
    return () => { activo = false; };
  }, [email]);

  const generar = async () => {
    setGenerando(true);
    setError("");
    try {
      const res = await fetch("/api/protocolo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...perfil }),
      });
      if (!res.ok) {
        setError("No se pudo generar el protocolo en este momento. Intenta de nuevo en unos segundos.");
      } else {
        const json = await res.json();
        setData(json.protocolo || null);
      }
    } catch {
      setError("Error de conexión al generar el protocolo.");
    }
    setGenerando(false);
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 24px 60px" }}>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: T.charcoal, margin: "0 0 8px" }}>Mi protocolo</h2>
      <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
        Tu plan personalizado de medicamentos y recomendaciones, propuesto por el Dr. Vitalis a partir de tu perfil.
      </p>

      {cargando ? (
        <div style={{ fontSize: "14px", color: T.muted }}>Cargando tu protocolo...</div>
      ) : !data ? (
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "28px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: T.ink, lineHeight: 1.6, margin: "0 0 18px" }}>
            Aún no tienes un protocolo. El Dr. Vitalis puede preparar un borrador personalizado según tu edad, país y motivo de consulta.
          </p>
          <button onClick={generar} disabled={generando} style={{ padding: "13px 26px", background: generando ? T.border : T.gold, color: T.white, border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: generando ? "not-allowed" : "pointer" }}>
            {generando ? "Generando tu protocolo..." : "Generar mi protocolo"}
          </button>
          {error && <div style={{ fontSize: "13px", color: T.danger, marginTop: "14px" }}>{error}</div>}
        </div>
      ) : (
        <>
          <div style={{ background: "rgba(184,146,42,0.1)", border: `1px solid ${T.border}`, borderRadius: "10px", padding: "14px 16px", marginBottom: "20px", fontSize: "13px", color: T.ink, lineHeight: 1.55 }}>
            Este protocolo es orientación generada con inteligencia artificial. Antes de iniciar cualquier medicamento, valídalo con un médico.
          </div>

          {data.medicamentos.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              {data.medicamentos.map((m, i) => (
                <div key={i} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "18px 20px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: T.charcoal, marginBottom: "8px" }}>{m.nombre}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: m.nota ? "10px" : 0 }}>
                    {m.dosis && <span style={{ fontSize: "12px", fontWeight: 600, color: T.teal, background: "rgba(45,125,111,0.1)", padding: "3px 10px", borderRadius: "999px" }}>Dosis: {m.dosis}</span>}
                    {m.frecuencia && <span style={{ fontSize: "12px", fontWeight: 600, color: T.goldDark, background: "rgba(184,146,42,0.12)", padding: "3px 10px", borderRadius: "999px" }}>{m.frecuencia}</span>}
                  </div>
                  {m.nota && <p style={{ fontSize: "13px", color: T.muted, lineHeight: 1.55, margin: 0 }}>{m.nota}</p>}
                </div>
              ))}
            </div>
          )}

          {data.notasMedicas && (
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "18px 20px", marginBottom: "20px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: T.charcoal, marginBottom: "8px" }}>Recomendaciones del Dr. Vitalis</div>
              <div style={{ fontSize: "14px", color: T.ink, lineHeight: 1.6 }}><Markdown text={data.notasMedicas} /></div>
            </div>
          )}

          <button onClick={generar} disabled={generando} style={{ padding: "11px 20px", background: "transparent", color: T.charcoal, border: `1px solid ${T.border}`, borderRadius: "8px", fontSize: "13px", fontWeight: 700, cursor: generando ? "not-allowed" : "pointer" }}>
            {generando ? "Actualizando..." : "Regenerar protocolo"}
          </button>
          {error && <div style={{ fontSize: "13px", color: T.danger, marginTop: "14px" }}>{error}</div>}
        </>
      )}
    </div>
  );
};

const ProgresoView = ({ hoy, semana, onGuardar, guardando }: { hoy: Adherencia; semana: DiaAdherencia[]; onGuardar: (a: Adherencia) => void; guardando: boolean }) => {
  const maxBarra = Math.max(TOTAL_EJERCICIOS, ...semana.map((d) => d.ejercicios), 1);
  const racha = (() => {
    // Cuenta días consecutivos con al menos un ejercicio, terminando hoy.
    const ordenado = [...semana].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    let n = 0;
    for (const d of ordenado) {
      if (d.ejercicios > 0) n++;
      else break;
    }
    return n;
  })();

  const ajustar = (campo: keyof Adherencia, delta: number) => {
    const tope = campo === "ejercicios" ? TOTAL_EJERCICIOS : 12;
    const valor = Math.min(tope, Math.max(0, hoy[campo] + delta));
    onGuardar({ ...hoy, [campo]: valor });
  };

  const Contador = ({ titulo, campo, max }: { titulo: string; campo: keyof Adherencia; max: number }) => (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "20px", flex: 1, minWidth: "240px" }}>
      <div style={{ fontSize: "14px", fontWeight: 700, color: T.charcoal, marginBottom: "14px" }}>{titulo}</div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={() => ajustar(campo, -1)} disabled={guardando} aria-label={`Restar ${titulo}`} style={{ width: "40px", height: "40px", borderRadius: "999px", border: `1px solid ${T.border}`, background: T.cream, fontSize: "20px", fontWeight: 700, color: T.charcoal, cursor: "pointer" }}>−</button>
        <div style={{ fontSize: "28px", fontWeight: 800, color: T.charcoal, minWidth: "70px", textAlign: "center" }}>
          {hoy[campo]}<span style={{ fontSize: "15px", color: T.muted, fontWeight: 600 }}> / {max}</span>
        </div>
        <button onClick={() => ajustar(campo, 1)} disabled={guardando} aria-label={`Sumar ${titulo}`} style={{ width: "40px", height: "40px", borderRadius: "999px", border: "none", background: T.gold, fontSize: "20px", fontWeight: 700, color: T.white, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "32px 24px 60px" }}>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: T.charcoal, margin: "0 0 8px" }}>Mi progreso</h2>
      <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 24px", lineHeight: 1.6 }}>
        Registra tu adherencia diaria. La constancia es lo que mejora tus resultados con el tiempo.
      </p>

      {racha > 0 && (
        <div style={{ background: "rgba(45,125,111,0.1)", border: `1px solid ${T.border}`, borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "14px", color: T.teal, fontWeight: 700 }}>
          Racha actual: {racha} {racha === 1 ? "día" : "días"} seguidos con ejercicios. Sigue así.
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
        <Contador titulo="Ejercicios de hoy" campo="ejercicios" max={TOTAL_EJERCICIOS} />
        <Contador titulo="Dosis tomadas hoy" campo="dosis" max={12} />
      </div>

      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "20px" }}>
        <div style={{ fontSize: "14px", fontWeight: 700, color: T.charcoal, marginBottom: "16px" }}>Últimos 7 días</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "120px" }}>
          {semana.length === 0 ? (
            <div style={{ fontSize: "13px", color: T.muted }}>Aún no hay registros. Empieza marcando tus ejercicios de hoy.</div>
          ) : (
            semana.map((d) => {
              const altura = Math.round((d.ejercicios / maxBarra) * 100);
              const dia = d.fecha.slice(8, 10);
              return (
                <div key={d.fecha} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", maxWidth: "34px", height: `${Math.max(altura, 4)}%`, background: d.ejercicios > 0 ? T.gold : T.border, borderRadius: "4px" }} title={`${d.ejercicios} ejercicios`} />
                  <span style={{ fontSize: "11px", color: T.muted }}>{dia}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const ChatView = ({ perfil }: { perfil: Perfil }) => {
  const saludo: ChatMessage = {
    role: "assistant",
    content: `Buenas tardes, ${perfil.nombre || "paciente"}. Soy el Dr. Vitalis. ¿En qué puedo ayudarle hoy?`,
  };
  const [msgs, setMsgs] = useState<ChatMessage[]>([saludo]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cargado, setCargado] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  // Recupera la conversación previa del paciente al entrar.
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const res = await fetch(`/api/chat-history?email=${encodeURIComponent(perfil.email)}`);
        const json = await res.json();
        if (activo && Array.isArray(json.messages) && json.messages.length > 0) {
          setMsgs(json.messages);
        }
      } catch {
        // Sin historial: se mantiene el saludo inicial.
      }
      if (activo) setCargado(true);
    })();
    return () => { activo = false; };
  }, [perfil.email]);

  const persistir = useCallback((conversacion: ChatMessage[]) => {
    fetch("/api/chat-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: perfil.email, messages: conversacion }),
    }).catch(() => { /* el guardado se reintenta en el siguiente turno */ });
  }, [perfil.email]);

  const systemPrompt =
    `Eres el Dr. Vitalis, urólogo especialista en salud sexual masculina. ` +
    `Paciente: ${perfil.nombre}, ${perfil.edad || "edad no indicada"}, ${perfil.pais || "país no indicado"}. ` +
    `Condición: ${perfil.condicion || "no indicada"}. Responde siempre en español, con tono médico ` +
    `profesional, claro y empático. Puedes usar Markdown sencillo (negritas y listas) para ordenar la ` +
    `información. No uses emojis. ${SEGURIDAD}`;

  const enviar = async (text: string) => {
    if (!text.trim() || loading) return;
    const base: ChatMessage[] = [...msgs, { role: "user", content: text }];
    setMsgs(base);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/vitalis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          messages: base.slice(-20),
          stream: true,
        }),
      });

      if (!res.ok || !res.body) throw new Error("sin stream");

      // Lee la respuesta token a token y la muestra en vivo.
      setMsgs((p) => [...p, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        setMsgs((p) => {
          const copia = [...p];
          copia[copia.length - 1] = { role: "assistant", content: acumulado };
          return copia;
        });
      }

      const respuesta = acumulado.trim() || "Disculpe, no pude responder en este momento.";
      const final: ChatMessage[] = [...base, { role: "assistant", content: respuesta }];
      setMsgs(final);
      persistir(final);
    } catch {
      const final: ChatMessage[] = [...base, { role: "assistant", content: "Error de conexión. Intente nuevamente en unos segundos." }];
      setMsgs(final);
    }
    setLoading(false);
  };

  // Sugerencias iniciales para quien no sabe cómo empezar (solo al inicio).
  const sugerencias = [
    "¿Cómo empiezo mi tratamiento?",
    "¿Qué ejercicios me recomiendas?",
    "Tengo dudas sobre mi medicación",
  ];
  const mostrarSugerencias = cargado && msgs.length === 1 && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: T.cream }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "82%", padding: "11px 15px", borderRadius: "12px", background: m.role === "user" ? T.charcoal : T.white, color: m.role === "user" ? T.white : T.ink, fontSize: "14px", lineHeight: 1.5, border: m.role === "assistant" ? `1px solid ${T.border}` : "none" }}>
              {m.role === "assistant" ? <Markdown text={m.content || "..."} /> : m.content}
            </div>
          </div>
        ))}
        {loading && msgs[msgs.length - 1]?.role !== "assistant" && (
          <div style={{ color: T.muted, fontSize: "12px", paddingLeft: "4px" }}>El Dr. Vitalis está escribiendo...</div>
        )}

        {mostrarSugerencias && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "6px" }}>
            {sugerencias.map((s) => (
              <button key={s} onClick={() => enviar(s)} style={{ padding: "8px 14px", background: T.white, color: T.charcoal, border: `1px solid ${T.border}`, borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>{s}</button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border}`, background: T.white, display: "flex", gap: "10px" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escriba su consulta..." aria-label="Escriba su consulta" onKeyDown={(e) => { if (e.key === "Enter") enviar(input); }} style={{ flex: 1, padding: "12px", border: `1px solid ${T.border}`, borderRadius: "8px", fontSize: "14px" }} />
        <button onClick={() => enviar(input)} disabled={loading || !input.trim()} style={{ padding: "12px 20px", background: loading || !input.trim() ? T.border : T.gold, color: T.white, border: "none", borderRadius: "8px", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "14px" }}>Enviar</button>
      </div>
    </div>
  );
};

// Cascarón de la app para suscriptores: navegación entre consulta, protocolo,
// ejercicios y progreso, con estado de adherencia compartido.
type Tab = "consulta" | "protocolo" | "ejercicios" | "progreso";

const AppShell = ({ perfil, onLogout }: { perfil: Perfil; onLogout: () => void }) => {
  const [tab, setTab] = useState<Tab>("consulta");
  const [hoy, setHoy] = useState<Adherencia>({ ejercicios: 0, dosis: 0 });
  const [semana, setSemana] = useState<DiaAdherencia[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [gestionando, setGestionando] = useState(false);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const res = await fetch(`/api/adherencia?email=${encodeURIComponent(perfil.email)}`);
        const json = await res.json();
        if (!activo) return;
        if (json.hoy) setHoy(json.hoy);
        if (Array.isArray(json.semana)) setSemana(json.semana);
      } catch {
        // Sin datos de adherencia: se parte de cero.
      }
    })();
    return () => { activo = false; };
  }, [perfil.email]);

  const guardarAdherencia = useCallback(async (a: Adherencia) => {
    setHoy(a);
    setGuardando(true);
    const fecha = new Date().toISOString().slice(0, 10);
    setSemana((prev) => {
      const sin = prev.filter((d) => d.fecha !== fecha);
      return [...sin, { fecha, ejercicios: a.ejercicios, dosis: a.dosis }].sort((x, y) => (x.fecha < y.fecha ? -1 : 1));
    });
    try {
      await fetch("/api/adherencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: perfil.email, ...a }),
      });
    } catch {
      // El registro se reintenta en la siguiente interacción.
    }
    setGuardando(false);
  }, [perfil.email]);

  const marcarEjercicioHecho = useCallback(() => {
    guardarAdherencia({ ...hoy, ejercicios: Math.min(TOTAL_EJERCICIOS, hoy.ejercicios + 1) });
  }, [hoy, guardarAdherencia]);

  const gestionarSuscripcion = async () => {
    setGestionando(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: perfil.email }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
      else setGestionando(false);
    } catch {
      setGestionando(false);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "consulta", label: "Consulta" },
    { id: "protocolo", label: "Mi protocolo" },
    { id: "ejercicios", label: "Ejercicios" },
    { id: "progreso", label: "Progreso" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.cream }}>
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "999px", background: T.gold, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px" }}>V</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: T.charcoal }}>Dr. Vitalis</div>
              <div style={{ fontSize: "11px", color: T.teal }}>En línea</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={gestionarSuscripcion} disabled={gestionando} style={{ padding: "8px 14px", background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{gestionando ? "Abriendo..." : "Suscripción"}</button>
            <button onClick={onLogout} style={{ padding: "8px 14px", background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Salir</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: "4px", padding: "0 12px", overflowX: "auto" }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${tab === t.id ? T.gold : "transparent"}`,
                color: tab === t.id ? T.charcoal : T.muted,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowY: tab === "consulta" ? "hidden" : "auto" }}>
        {tab === "consulta" && <ChatView perfil={perfil} />}
        {tab === "protocolo" && <ProtocoloView email={perfil.email} perfil={perfil} />}
        {tab === "ejercicios" && <Ejercicios onMarcarHecho={marcarEjercicioHecho} />}
        {tab === "progreso" && <ProgresoView hoy={hoy} semana={semana} onGuardar={guardarAdherencia} guardando={guardando} />}
      </div>
    </div>
  );
};

/* ------------------------------- app raíz -------------------------------- */

export default function App() {
  const [screen, setScreen] = useState<"landing" | "auth" | "onboarding" | "app" | "success">("landing");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [perfil, setPerfil] = useState<Perfil>(PERFIL_VACIO);
  const [identityId, setIdentityId] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Al cargar: procesa los enlaces de confirmación de Netlify Identity, restaura
  // la sesión si existe y reconcilia el regreso del pago de Stripe (?success=true).
  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        await handleAuthCallback();
      } catch {
        // Sin callback en la URL: carga normal.
      }

      const exito = typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("success") === "true";
      if (exito && typeof window !== "undefined") {
        window.history.replaceState({}, "", "/");
      }

      let user = null;
      try {
        user = await getUser();
      } catch {
        user = null;
      }
      if (!activo) return;

      if (user?.email) {
        setIdentityId(user.id || "");
        const cuenta = await cargarCuenta(user.email);
        if (!activo) return;
        const base: Perfil = cuenta.profile || { ...PERFIL_VACIO, email: user.email, nombre: user.name || "" };
        setPerfil({ ...base, email: user.email });
        setSubscribed(cuenta.subscribed);
        if (exito || cuenta.subscribed) {
          setScreen(exito ? "success" : "app");
        } else {
          setScreen("onboarding");
        }
      }
    })();
    return () => { activo = false; };
  }, []);

  const irACheckout = async (p: Perfil) => {
    setRedirecting(true);
    await guardarPerfil(p, identityId);
    const url = await iniciarCheckout(p);
    if (url) {
      window.location.href = url;
    } else {
      setRedirecting(false);
      alert("No se pudo iniciar el pago. Verifica tus datos e intenta de nuevo.");
    }
  };

  const completarOnboarding = async (p: Perfil) => {
    setPerfil(p);
    if (subscribed) {
      await guardarPerfil(p, identityId);
      setScreen("app");
    } else {
      // Sin suscripción activa no hay consulta: el onboarding lleva al pago de Stripe.
      irACheckout(p);
    }
  };

  const trasAutenticar = async (email: string, id: string) => {
    setIdentityId(id);
    const cuenta = await cargarCuenta(email);
    const base: Perfil = cuenta.profile || { ...PERFIL_VACIO, email };
    setPerfil({ ...base, email });
    setSubscribed(cuenta.subscribed);
    setScreen(cuenta.subscribed ? "app" : "onboarding");
  };

  const cerrarSesion = async () => {
    try {
      await logout();
    } catch {
      // Ignora errores de cierre de sesión.
    }
    setPerfil(PERFIL_VACIO);
    setIdentityId("");
    setSubscribed(false);
    setScreen("landing");
  };

  const irAuth = (modo: "login" | "signup") => {
    setAuthMode(modo);
    setScreen("auth");
  };

  return (
    <>
      {screen === "landing" && (
        <Landing onSubscribe={() => irAuth("signup")} onLogin={() => irAuth("login")} />
      )}
      {screen === "auth" && (
        <AuthScreen modoInicial={authMode} onAuthenticated={trasAutenticar} onBack={() => setScreen("landing")} />
      )}
      {screen === "onboarding" && <Onboarding inicial={perfil} subscribed={subscribed} loading={redirecting} onComplete={completarOnboarding} />}
      {screen === "app" && <AppShell perfil={perfil} onLogout={cerrarSesion} />}
      {screen === "success" && <SuccessBanner onContinue={() => setScreen(perfil.nombre ? "app" : "onboarding")} />}
    </>
  );
}
