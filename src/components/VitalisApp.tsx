'use client';
import { useState, useRef, useEffect } from "react";

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
};

type Perfil = {
  nombre: string;
  email: string;
  edad: string;
  pais: string;
  condicion: string;
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const PRECIO = "$599 MXN";

// Protocolo de ejercicios urológicos guiados. Cada ejercicio enlaza a su propio
// video específico para dar un acompañamiento de alto valor. Sustituye cada URL
// por el video definitivo de la clínica (YouTube, Vimeo o enlace privado).
type Ejercicio = {
  id: string;
  nombre: string;
  objetivo: string;
  frecuencia: string;
  descripcion: string;
  video: string;
};

const EJERCICIOS: Ejercicio[] = [
  {
    id: "kegel-base",
    nombre: "Kegel de base",
    objetivo: "Fortalecer el suelo pélvico",
    frecuencia: "3 series de 10, 2 veces al día",
    descripcion:
      "Identifica los músculos del suelo pélvico (los que cortan el flujo de orina) y contráelos durante 5 segundos, luego relaja 5 segundos. Mantén el abdomen y los glúteos relajados.",
    video: "https://www.youtube.com/results?search_query=ejercicios+kegel+hombres",
  },
  {
    id: "contracciones-rapidas",
    nombre: "Contracciones rápidas",
    objetivo: "Mejorar el control eyaculatorio",
    frecuencia: "3 series de 15, 1 vez al día",
    descripcion:
      "Contrae y relaja el suelo pélvico de forma rápida y rítmica. Este ejercicio entrena la respuesta refleja del músculo y favorece el control durante la actividad sexual.",
    video: "https://www.youtube.com/results?search_query=pelvic+floor+quick+flicks+men",
  },
  {
    id: "kegel-sostenido",
    nombre: "Kegel sostenido",
    objetivo: "Resistencia del suelo pélvico",
    frecuencia: "2 series de 8, 2 veces al día",
    descripcion:
      "Contrae el suelo pélvico y mantén la tensión entre 8 y 10 segundos antes de relajar lentamente. Aumenta la fuerza sostenida que soporta la función eréctil.",
    video: "https://www.youtube.com/results?search_query=long+kegel+holds+men",
  },
  {
    id: "puente-gluteos",
    nombre: "Puente de glúteos",
    objetivo: "Estabilidad de cadera y pelvis",
    frecuencia: "3 series de 12, día por medio",
    descripcion:
      "Acostado boca arriba con las rodillas flexionadas, eleva la cadera contrayendo glúteos y suelo pélvico. Mejora la irrigación de la zona pélvica y el soporte muscular.",
    video: "https://www.youtube.com/results?search_query=glute+bridge+pelvic+floor",
  },
  {
    id: "respiracion-diafragmatica",
    nombre: "Respiración diafragmática",
    objetivo: "Relajar y coordinar el suelo pélvico",
    frecuencia: "5 minutos, 1 vez al día",
    descripcion:
      "Respira profundo llevando el aire al abdomen; al inhalar relaja el suelo pélvico y al exhalar contráelo suavemente. Reduce la tensión que afecta el rendimiento sexual.",
    video: "https://www.youtube.com/results?search_query=diaphragmatic+breathing+pelvic+floor",
  },
  {
    id: "estiramiento-flexores",
    nombre: "Estiramiento de flexores de cadera",
    objetivo: "Liberar tensión pélvica",
    frecuencia: "30 segundos por lado, diario",
    descripcion:
      "En posición de zancada, lleva la cadera hacia adelante manteniendo la espalda recta. Libera la tensión del psoas que comprime la zona pélvica y mejora la movilidad.",
    video: "https://www.youtube.com/results?search_query=hip+flexor+stretch",
  },
];

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

const Header = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", color: T.white, fontWeight: 700, fontSize: "16px" }}>V</div>
    <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.08em", color: T.charcoal }}>VITALIS</span>
  </div>
);

const Landing = ({ onSubscribe }: { onSubscribe: () => void }) => (
  <div style={{ minHeight: "100vh", background: T.cream, color: T.ink }}>
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", maxWidth: "1080px", margin: "0 auto" }}>
      <Header />
      <button onClick={onSubscribe} style={{ padding: "9px 18px", background: T.gold, color: T.white, border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Activar Vitalis Pro</button>
    </header>

    {/* Hero: quiénes somos y qué hacemos */}
    <section style={{ maxWidth: "760px", margin: "0 auto", padding: "60px 24px 40px", textAlign: "center" }}>
      <div style={{ display: "inline-block", padding: "5px 12px", background: "rgba(45,125,111,0.1)", color: T.teal, borderRadius: "999px", fontSize: "12px", fontWeight: 600, marginBottom: "20px" }}>Salud sexual masculina con inteligencia artificial</div>
      <h1 style={{ fontSize: "44px", lineHeight: 1.1, fontWeight: 800, color: T.charcoal, margin: "0 0 18px" }}>Tu urólogo experto, disponible las 24 horas</h1>
      <p style={{ fontSize: "17px", lineHeight: 1.6, color: T.muted, margin: "0 auto 32px", maxWidth: "600px" }}>
        Vitalis es una plataforma de salud sexual masculina guiada por el Dr. Vitalis, un especialista con IA que entiende tu caso, te orienta de forma privada y te acompaña con un protocolo personalizado: medicamentos con dosis, ejercicios terapéuticos en video y seguimiento.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={onSubscribe} style={{ padding: "14px 30px", background: T.gold, color: T.white, border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Activar Vitalis Pro — {PRECIO}/mes</button>
      </div>
      <p style={{ fontSize: "13px", color: T.muted, marginTop: "16px" }}>Acceso completo al Dr. Vitalis y a tu protocolo. Cancela cuando quieras.</p>
    </section>

    {/* Qué hacemos */}
    <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "30px 24px 50px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "18px" }}>
        {[
          { t: "Consulta privada 24/7", d: "Conversa con el Dr. Vitalis cuando lo necesites. Respuestas claras, en español y con tono médico profesional." },
          { t: "Protocolo personalizado", d: "Según tu edad, país y condición, recibes un plan con medicamentos, dosis y ejercicios terapéuticos guiados en video." },
          { t: "Seguimiento de adherencia", d: "Lleva el control de ejercicios completados y dosis tomadas para mejorar tus resultados con el tiempo." },
        ].map((c) => (
          <div key={c.t} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "24px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "999px", background: T.gold, marginBottom: "14px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: T.charcoal, margin: "0 0 8px" }}>{c.t}</h3>
            <p style={{ fontSize: "14px", lineHeight: 1.55, color: T.muted, margin: 0 }}>{c.d}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Cómo funciona */}
    <section style={{ maxWidth: "760px", margin: "0 auto", padding: "10px 24px 50px" }}>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: T.charcoal, textAlign: "center", margin: "0 0 28px" }}>Cómo funciona</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[
          ["1", "Activa tu suscripción", "Confirma tus datos y completas el pago seguro con Stripe para desbloquear Vitalis Pro."],
          ["2", "Habla con el Dr. Vitalis", "Recibes orientación inmediata sobre tu salud sexual, sin esperas ni citas."],
          ["3", "Sigue tu protocolo", "Accedes a tu plan completo con ejercicios guiados en video y acompañamiento continuo."],
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
    <section style={{ maxWidth: "480px", margin: "0 auto", padding: "10px 24px 70px" }}>
      <div style={{ background: T.white, border: `2px solid ${T.gold}`, borderRadius: "16px", padding: "32px", textAlign: "center" }}>
        <div style={{ fontSize: "13px", fontWeight: 700, color: T.teal, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "12px" }}>Vitalis Pro</div>
        <div style={{ fontSize: "42px", fontWeight: 800, color: T.charcoal }}>{PRECIO}<span style={{ fontSize: "16px", fontWeight: 600, color: T.muted }}> / mes</span></div>
        <p style={{ fontSize: "14px", color: T.muted, margin: "10px 0 22px" }}>Acceso completo al Dr. Vitalis, protocolo personalizado y seguimiento. Cancela cuando quieras.</p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", textAlign: "left", display: "flex", flexDirection: "column", gap: "10px" }}>
          {["Consultas ilimitadas 24/7", "Medicamentos con dosis exactas", "Ejercicios terapéuticos guiados en video", "Seguimiento de tu progreso"].map((f) => (
            <li key={f} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", color: T.ink }}>
              <span style={{ color: T.teal, fontWeight: 800 }}>✓</span>{f}
            </li>
          ))}
        </ul>
        <button onClick={onSubscribe} style={{ width: "100%", padding: "15px", background: T.gold, color: T.white, border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Suscribirme</button>
      </div>
    </section>

    <footer style={{ borderTop: `1px solid ${T.border}`, padding: "24px", textAlign: "center", fontSize: "12px", color: T.muted }}>
      Vitalis — Salud sexual masculina con IA. La información no sustituye una consulta médica presencial de urgencia.
    </footer>
  </div>
);

const SuccessBanner = ({ onContinue }: { onContinue: () => void }) => (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: T.cream, textAlign: "center" }}>
    <div style={{ width: "56px", height: "56px", borderRadius: "999px", background: T.teal, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>✓</div>
    <h2 style={{ fontSize: "28px", fontWeight: 800, color: T.charcoal, margin: "0 0 12px" }}>Suscripción activada</h2>
    <p style={{ fontSize: "16px", color: T.muted, maxWidth: "440px", margin: "0 0 28px" }}>Gracias por confiar en Vitalis. Tu acceso a Vitalis Pro está activo. Ya puedes iniciar tu consulta con el Dr. Vitalis.</p>
    <button onClick={onContinue} style={{ padding: "14px 30px", background: T.gold, color: T.white, border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>Iniciar consulta</button>
  </div>
);

const Onboarding = ({ subscribed, loading, onComplete }: { subscribed: boolean; loading: boolean; onComplete: (p: Perfil) => void }) => {
  const [form, setForm] = useState<Perfil>({ nombre: "", email: "", edad: "", pais: "", condicion: "" });
  const valido = form.nombre.trim() !== "" && form.email.trim() !== "";
  const inputStyle = { width: "100%", padding: "12px", marginBottom: "14px", border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" as const, background: T.white };

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
        <input placeholder="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />
        <input placeholder="Correo electrónico" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
        <input placeholder="Edad" value={form.edad} onChange={(e) => setForm({ ...form, edad: e.target.value })} style={inputStyle} />
        <input placeholder="País" value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} style={inputStyle} />
        <input placeholder="Condición o motivo de consulta" value={form.condicion} onChange={(e) => setForm({ ...form, condicion: e.target.value })} style={inputStyle} />
        <button
          onClick={() => valido && !loading && onComplete(form)}
          disabled={!valido || loading}
          style={{ width: "100%", padding: "14px", background: valido && !loading ? T.gold : T.border, color: T.white, border: "none", borderRadius: "8px", cursor: valido && !loading ? "pointer" : "not-allowed", fontSize: "15px", fontWeight: 700 }}
        >
          {loading ? "Redirigiendo a pago seguro..." : subscribed ? "Iniciar consulta" : `Continuar al pago — ${PRECIO}/mes`}
        </button>
      </div>
    </div>
  );
};

const Ejercicios = ({ onBack }: { onBack: () => void }) => (
  <div style={{ minHeight: "100vh", background: T.cream }}>
    <div style={{ padding: "14px 18px", background: T.white, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: "14px", position: "sticky", top: 0, zIndex: 1 }}>
      <button onClick={onBack} style={{ padding: "8px 14px", background: "transparent", color: T.charcoal, border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>← Volver a la consulta</button>
      <div style={{ fontSize: "15px", fontWeight: 700, color: T.charcoal }}>Protocolo de ejercicios</div>
    </div>

    <section style={{ maxWidth: "820px", margin: "0 auto", padding: "32px 24px 60px" }}>
      <h2 style={{ fontSize: "26px", fontWeight: 800, color: T.charcoal, margin: "0 0 8px" }}>Ejercicios urológicos guiados</h2>
      <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 28px", lineHeight: 1.6 }}>
        Cada ejercicio incluye su propio video guiado. Sigue la técnica, respeta la frecuencia indicada y registra tu avance para mejorar tus resultados.
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
                <a
                  href={ej.video}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 18px", background: T.gold, color: T.white, borderRadius: "8px", fontSize: "14px", fontWeight: 700, textDecoration: "none" }}
                >
                  <span style={{ fontSize: "12px" }}>▶</span> Ver video guiado
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const ChatView = ({ perfil, onExercises }: { perfil: Perfil; onExercises: () => void }) => {
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { role: "assistant", content: `Buenas tardes, ${perfil.nombre || "paciente"}. Soy el Dr. Vitalis. ¿En qué puedo ayudarle hoy?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const newMsgs: ChatMessage[] = [...msgs, { role: "user", content: text }];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/vitalis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: `Eres el Dr. Vitalis, urólogo especialista en salud sexual masculina. Paciente: ${perfil.nombre}, ${perfil.edad || "edad no indicada"}, ${perfil.pais || "país no indicado"}. Condición: ${perfil.condicion || "no indicada"}. Responde siempre en español, con tono médico profesional, claro y empático. No uses emojis.`,
          messages: newMsgs,
        }),
      });
      const data = await res.json();
      setMsgs((p) => [...p, { role: "assistant", content: data.reply || "Disculpe, no pude responder en este momento." }]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "Error de conexión. Intente nuevamente en unos segundos." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.cream }}>
      <div style={{ padding: "14px 18px", background: T.white, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "999px", background: T.gold, color: T.white, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px" }}>V</div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: T.charcoal }}>Dr. Vitalis</div>
            <div style={{ fontSize: "11px", color: T.teal }}>En línea</div>
          </div>
        </div>
        <button onClick={onExercises} style={{ padding: "8px 16px", background: "transparent", color: T.charcoal, border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Ejercicios guiados</button>
      </div>

      <div style={{ background: "rgba(45,125,111,0.08)", borderBottom: `1px solid ${T.border}`, padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "12px", color: T.ink }}>Tu protocolo incluye ejercicios urológicos guiados en video.</span>
        <button onClick={onExercises} style={{ padding: "8px 16px", background: T.teal, color: T.white, border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Ver mi protocolo</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "82%", padding: "11px 15px", borderRadius: "12px", background: m.role === "user" ? T.charcoal : T.white, color: m.role === "user" ? T.white : T.ink, fontSize: "14px", lineHeight: 1.5, border: m.role === "assistant" ? `1px solid ${T.border}` : "none", whiteSpace: "pre-wrap" }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ color: T.muted, fontSize: "12px", paddingLeft: "4px" }}>El Dr. Vitalis está escribiendo...</div>}
        <div ref={endRef} />
      </div>

      <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border}`, background: T.white, display: "flex", gap: "10px" }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escriba su consulta..." onKeyDown={(e) => { if (e.key === "Enter") send(input); }} style={{ flex: 1, padding: "12px", border: `1px solid ${T.border}`, borderRadius: "8px", fontSize: "14px" }} />
        <button onClick={() => send(input)} style={{ padding: "12px 20px", background: T.gold, color: T.white, border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>Enviar</button>
      </div>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<"landing" | "onboarding" | "chat" | "ejercicios" | "success">("landing");
  const [perfil, setPerfil] = useState<Perfil>({ nombre: "", email: "", edad: "", pais: "", condicion: "" });
  const [subscribed, setSubscribed] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "true") {
      setSubscribed(true);
      setScreen("success");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  const irACheckout = async (p: Perfil) => {
    setRedirecting(true);
    const url = await iniciarCheckout(p);
    if (url) {
      window.location.href = url;
    } else {
      setRedirecting(false);
      alert("No se pudo iniciar el pago. Verifica tus datos e intenta de nuevo.");
    }
  };

  const completarOnboarding = (p: Perfil) => {
    setPerfil(p);
    // Sin suscripción activa no hay consulta: el onboarding lleva al pago de Stripe.
    // Una vez confirmado el pago (success), el mismo formulario da acceso al chat.
    if (subscribed) {
      setScreen("chat");
    } else {
      irACheckout(p);
    }
  };

  return (
    <>
      {screen === "landing" && (
        <Landing onSubscribe={() => setScreen("onboarding")} />
      )}
      {screen === "onboarding" && <Onboarding subscribed={subscribed} loading={redirecting} onComplete={completarOnboarding} />}
      {screen === "chat" && (
        <ChatView perfil={perfil} onExercises={() => setScreen("ejercicios")} />
      )}
      {screen === "ejercicios" && <Ejercicios onBack={() => setScreen("chat")} />}
      {screen === "success" && <SuccessBanner onContinue={() => setScreen(perfil.nombre ? "chat" : "onboarding")} />}
    </>
  );
}
