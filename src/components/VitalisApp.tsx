'use client';
import { useState, useRef, useEffect } from "react";

const T = {
  cream: "#F7F4EE",
  creamDeep: "#EFE9DF",
  charcoal: "#1B1B1D",
  gold: "#B8922A",
  goldDark: "#9A7A1F",
  white: "#FFFFFF",
  ink: "#2E2E30",
  border: "#E2DCCF",
  muted: "#7A7670",
  teal: "#2D7D6F",
};

const display = "var(--font-display), Georgia, serif";

type Perfil = {
  nombre: string;
  email: string;
  edad: string;
  pais: string;
  condicion: string;
};

type Intent = "chat" | "subscribe";
type ChatMessage = { role: "user" | "assistant"; content: string };

const PRECIO = "$599 MXN";
const FREE_QUESTION_LIMIT = 5;
const LIMIT_MESSAGE =
  "Has completado tu test gratuito con el Dr. Vitalis. Activa Vitalis Pro para continuar con consultas ilimitadas, protocolo personalizado y seguimiento.";

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

async function iniciarCheckout(perfil: Perfil): Promise<string | null> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: perfil.email,
        nombre: perfil.nombre,
        edad: perfil.edad,
        pais: perfil.pais,
        condicion: perfil.condicion,
      }),
    });
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}

const Monogram = ({ size = 30 }: { size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: `linear-gradient(150deg, ${T.gold}, ${T.goldDark})`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: T.white,
      fontFamily: display,
      fontWeight: 600,
      fontSize: size * 0.52,
      boxShadow: "0 6px 16px -8px rgba(184,146,42,0.8)",
    }}
  >
    V
  </div>
);

const Header = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
    <Monogram />
    <span style={{ fontFamily: display, fontSize: "21px", fontWeight: 600, letterSpacing: "0.14em", color: T.charcoal }}>
      VITALIS
    </span>
  </div>
);

const Landing = ({ onStart, onSubscribe }: { onStart: () => void; onSubscribe: () => void }) => (
  <div style={{ minHeight: "100vh", background: T.cream, color: T.ink }}>
    {/* Atmospheric backdrop */}
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background:
          "radial-gradient(60% 50% at 78% 0%, rgba(184,146,42,0.10), transparent 60%), radial-gradient(55% 45% at 5% 18%, rgba(45,125,111,0.07), transparent 55%)",
      }}
    />
    <div style={{ position: "relative", zIndex: 1 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          maxWidth: "1120px",
          margin: "0 auto",
        }}
      >
        <Header />
        <button
          onClick={onStart}
          className="btn btn-ghost"
          style={{
            padding: "10px 20px",
            background: "transparent",
            color: T.charcoal,
            border: `1px solid ${T.border}`,
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
      </header>

      {/* Hero — asymmetric, editorial */}
      <section
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: "56px 24px 30px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
          gap: "48px",
          alignItems: "center",
        }}
        className="hero-grid"
      >
        <div className="rise" style={{ animationDelay: "0.05s" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "rgba(45,125,111,0.10)",
              color: T.teal,
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.02em",
              marginBottom: "24px",
            }}
          >
            <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: T.teal }} />
            Salud sexual masculina con IA clínica
          </div>
          <h1
            style={{
              fontFamily: display,
              fontSize: "clamp(38px, 5.4vw, 58px)",
              lineHeight: 1.04,
              fontWeight: 600,
              color: T.charcoal,
              margin: "0 0 20px",
              letterSpacing: "-0.01em",
            }}
          >
            Recupera el control de tu salud sexual,{" "}
            <span style={{ fontStyle: "italic", color: T.goldDark }}>con un especialista a tu lado</span>
          </h1>
          <p style={{ fontSize: "18px", lineHeight: 1.62, color: T.muted, margin: "0 0 30px", maxWidth: "540px" }}>
            El Dr. Vitalis es un urólogo guiado por inteligencia artificial que entiende tu caso, te orienta de forma
            privada y te acompaña con un protocolo a tu medida: medicamentos con dosis, ejercicios terapéuticos y
            seguimiento real de tu progreso.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={onStart}
              className="btn btn-primary"
              style={{
                padding: "15px 32px",
                background: T.gold,
                color: T.white,
                border: "none",
                borderRadius: "999px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Hablar con el Dr. Vitalis
            </button>
            <button
              onClick={onSubscribe}
              className="btn btn-ghost"
              style={{
                padding: "15px 30px",
                background: "transparent",
                color: T.charcoal,
                border: `1px solid ${T.charcoal}`,
                borderRadius: "999px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Conocer el programa
            </button>
          </div>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              marginTop: "26px",
              fontSize: "13px",
              color: T.muted,
              fontWeight: 600,
            }}
          >
            {["Confidencial", "Sin esperas ni citas", "Disponible 24/7"].map((t) => (
              <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                <span style={{ color: T.teal, fontWeight: 800 }}>✓</span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero conversation preview */}
        <div className="rise" style={{ animationDelay: "0.18s" }}>
          <div
            style={{
              background: T.white,
              border: `1px solid ${T.border}`,
              borderRadius: "20px",
              padding: "20px",
              boxShadow: "0 30px 60px -36px rgba(27,27,29,0.45)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <Monogram size={34} />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: T.charcoal }}>Dr. Vitalis</div>
                <div style={{ fontSize: "11px", color: T.teal, display: "flex", alignItems: "center", gap: "5px" }}>
                  <span className="status-online" style={{ width: "7px", height: "7px", borderRadius: "999px", background: T.teal }} />
                  En línea
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "80%",
                  background: T.charcoal,
                  color: T.white,
                  padding: "10px 14px",
                  borderRadius: "14px 14px 4px 14px",
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                }}
              >
                Doctor, tengo dudas sobre un tratamiento y prefiero no ir a consulta presencial todavía.
              </div>
              <div
                style={{
                  alignSelf: "flex-start",
                  maxWidth: "88%",
                  background: T.cream,
                  color: T.ink,
                  padding: "10px 14px",
                  borderRadius: "14px 14px 14px 4px",
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                  border: `1px solid ${T.border}`,
                }}
              >
                Entiendo perfectamente, y es completamente confidencial. Cuénteme desde cuándo lo nota y revisemos juntos
                las opciones, paso a paso.
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", paddingLeft: "4px", paddingTop: "2px" }}>
                <span className="dot" style={{ width: "6px", height: "6px", borderRadius: "999px", background: T.muted }} />
                <span className="dot" style={{ width: "6px", height: "6px", borderRadius: "999px", background: T.muted }} />
                <span className="dot" style={{ width: "6px", height: "6px", borderRadius: "999px", background: T.muted }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "18px 24px 36px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1px",
            background: T.border,
            border: `1px solid ${T.border}`,
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          {[
            ["Privacidad ante todo", "Tus conversaciones son confidenciales y tu información se mantiene protegida."],
            ["Criterio clínico", "Orientación con tono médico profesional, fundamentada y sin juicios."],
            ["Atención inmediata", "Respuestas claras a cualquier hora, sin salas de espera ni agendas."],
          ].map(([t, d]) => (
            <div key={t} style={{ background: T.cream, padding: "20px 22px" }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: T.charcoal, marginBottom: "6px" }}>{t}</div>
              <div style={{ fontSize: "13px", lineHeight: 1.5, color: T.muted }}>{d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Qué ofrecemos — numbered editorial cards */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "30px 24px 20px" }}>
        <div style={{ maxWidth: "560px", marginBottom: "30px" }}>
          <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: T.gold, marginBottom: "12px" }}>
            Lo que recibes
          </div>
          <h2 style={{ fontFamily: display, fontSize: "30px", fontWeight: 600, color: T.charcoal, margin: 0, lineHeight: 1.15 }}>
            Un acompañamiento completo, no solo respuestas
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          {[
            ["01", "Consulta privada 24/7", "Conversa con el Dr. Vitalis cuando lo necesites. Respuestas claras, en español y con tono médico profesional."],
            ["02", "Protocolo personalizado", "Según tu edad, país y condición, recibes un plan con medicamentos, dosis exactas y ejercicios terapéuticos."],
            ["03", "Seguimiento de adherencia", "Lleva el control de ejercicios completados y dosis tomadas para mejorar tus resultados con el tiempo."],
          ].map(([n, t, d]) => (
            <div
              key={n}
              className="card-lift"
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: "16px",
                padding: "26px",
              }}
            >
              <div style={{ fontFamily: display, fontSize: "26px", fontWeight: 600, color: T.gold, marginBottom: "16px", letterSpacing: "0.02em" }}>
                {n}
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: 700, color: T.charcoal, margin: "0 0 9px" }}>{t}</h3>
              <p style={{ fontSize: "14px", lineHeight: 1.58, color: T.muted, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section style={{ maxWidth: "780px", margin: "0 auto", padding: "48px 24px 30px" }}>
        <h2 style={{ fontFamily: display, fontSize: "30px", fontWeight: 600, color: T.charcoal, textAlign: "center", margin: "0 0 32px" }}>
          Cómo funciona
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            ["1", "Cuéntanos tu caso", "Completas un perfil breve y confidencial con tu información básica."],
            ["2", "Habla con el Dr. Vitalis", "Recibes orientación inmediata sobre tu salud sexual, sin esperas ni citas."],
            ["3", "Sigue tu protocolo", "Activas Vitalis para acceder a tu plan completo y al acompañamiento continuo."],
          ].map(([n, t, d]) => (
            <div
              key={n}
              style={{
                display: "flex",
                gap: "18px",
                alignItems: "center",
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: "14px",
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  width: "38px",
                  height: "38px",
                  borderRadius: "999px",
                  background: T.charcoal,
                  color: T.white,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: display,
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                {n}
              </div>
              <div>
                <div style={{ fontSize: "15.5px", fontWeight: 700, color: T.charcoal, marginBottom: "3px" }}>{t}</div>
                <div style={{ fontSize: "14px", color: T.muted, lineHeight: 1.5 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonios */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
          {[
            ["Por fin pude hablar de algo que llevaba años evitando. Sin pena y a mi ritmo.", "Andrés M.", "41 años · Guadalajara"],
            ["El protocolo fue claro: qué tomar, cuánto y por cuánto tiempo. Noté cambios en semanas.", "Roberto V.", "53 años · Monterrey"],
            ["Tener respuestas a las 2 de la mañana, sin sentirme juzgado, cambió todo para mí.", "Diego H.", "36 años · CDMX"],
          ].map(([quote, name, meta]) => (
            <figure
              key={name}
              style={{
                background: T.creamDeep,
                border: `1px solid ${T.border}`,
                borderRadius: "16px",
                padding: "26px",
                margin: 0,
              }}
            >
              <div style={{ fontFamily: display, fontSize: "40px", lineHeight: 0.6, color: T.gold, marginBottom: "8px" }}>“</div>
              <blockquote style={{ margin: "0 0 18px", fontSize: "15.5px", lineHeight: 1.6, color: T.ink, fontStyle: "italic" }}>
                {quote}
              </blockquote>
              <figcaption>
                <div style={{ fontSize: "14px", fontWeight: 700, color: T.charcoal }}>{name}</div>
                <div style={{ fontSize: "12.5px", color: T.muted }}>{meta}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Precio */}
      <section style={{ maxWidth: "500px", margin: "0 auto", padding: "20px 24px 30px" }}>
        <div
          style={{
            position: "relative",
            background: T.white,
            border: `1px solid ${T.gold}`,
            borderRadius: "20px",
            padding: "36px 32px",
            textAlign: "center",
            boxShadow: "0 30px 60px -40px rgba(184,146,42,0.7)",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 800, color: T.teal, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "14px" }}>
            Vitalis Pro
          </div>
          <div style={{ fontFamily: display, fontSize: "48px", fontWeight: 600, color: T.charcoal, lineHeight: 1 }}>
            {PRECIO}
            <span style={{ fontFamily: "var(--font-body)", fontSize: "16px", fontWeight: 600, color: T.muted }}> / mes</span>
          </div>
          <p style={{ fontSize: "14px", color: T.muted, margin: "14px 0 24px", lineHeight: 1.55 }}>
            Acceso completo al Dr. Vitalis, protocolo personalizado y seguimiento. Cancela cuando quieras.
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 26px", textAlign: "left", display: "flex", flexDirection: "column", gap: "12px" }}>
            {["Consultas ilimitadas 24/7", "Medicamentos con dosis exactas", "Ejercicios terapéuticos guiados", "Seguimiento de tu progreso"].map((f) => (
              <li key={f} style={{ display: "flex", gap: "11px", alignItems: "center", fontSize: "14px", color: T.ink }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: "20px",
                    height: "20px",
                    borderRadius: "999px",
                    background: "rgba(45,125,111,0.12)",
                    color: T.teal,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}
                >
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={onSubscribe}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "16px",
              background: T.gold,
              color: T.white,
              border: "none",
              borderRadius: "999px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Activar Vitalis Pro
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: "780px", margin: "0 auto", padding: "30px 24px 50px" }}>
        <h2 style={{ fontFamily: display, fontSize: "28px", fontWeight: 600, color: T.charcoal, textAlign: "center", margin: "0 0 26px" }}>
          Preguntas frecuentes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[
            ["¿Mis conversaciones son privadas?", "Sí. Lo que compartes con el Dr. Vitalis es confidencial y tu información se mantiene protegida en todo momento."],
            ["¿El Dr. Vitalis sustituye a mi médico?", "No. Vitalis te orienta y te acompaña, pero no reemplaza una valoración presencial ni la atención de urgencias."],
            ["¿Puedo cancelar cuando quiera?", "Por supuesto. La suscripción es mensual y puedes cancelarla en cualquier momento, sin penalizaciones."],
            ["¿Cómo se realiza el cobro?", `El cobro de ${PRECIO} al mes se procesa de forma segura a través de Stripe.`],
          ].map(([q, a]) => (
            <details
              key={q}
              style={{
                background: T.white,
                border: `1px solid ${T.border}`,
                borderRadius: "12px",
                padding: "16px 20px",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: T.charcoal,
                  listStyle: "none",
                }}
              >
                {q}
              </summary>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: T.muted, margin: "12px 0 0" }}>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "30px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
          <Header />
        </div>
        <p style={{ fontSize: "12.5px", color: T.muted, maxWidth: "560px", margin: "0 auto", lineHeight: 1.6 }}>
          Vitalis — Salud sexual masculina con IA. La información que ofrece el Dr. Vitalis es orientativa y no sustituye
          una consulta médica presencial ni la atención de urgencia.
        </p>
      </footer>
    </div>
  </div>
);

const SuccessBanner = ({ onContinue }: { onContinue: () => void }) => (
  <div
    style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: T.cream,
      textAlign: "center",
    }}
  >
    <div
      className="fade"
      style={{
        width: "62px",
        height: "62px",
        borderRadius: "999px",
        background: T.teal,
        color: T.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "30px",
        fontWeight: 800,
        marginBottom: "26px",
        boxShadow: "0 16px 36px -16px rgba(45,125,111,0.8)",
      }}
    >
      ✓
    </div>
    <h2 style={{ fontFamily: display, fontSize: "32px", fontWeight: 600, color: T.charcoal, margin: "0 0 14px" }}>
      Suscripción activada
    </h2>
    <p style={{ fontSize: "16px", color: T.muted, maxWidth: "460px", margin: "0 0 30px", lineHeight: 1.6 }}>
      Gracias por confiar en Vitalis. Tu acceso a Vitalis Pro está activo. Ya puedes iniciar tu consulta con el Dr.
      Vitalis.
    </p>
    <button
      onClick={onContinue}
      className="btn btn-primary"
      style={{
        padding: "15px 32px",
        background: T.gold,
        color: T.white,
        border: "none",
        borderRadius: "999px",
        fontSize: "15px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      Entrar a mi consulta
    </button>
  </div>
);

const Onboarding = ({ intent, loading, onComplete }: { intent: Intent; loading: boolean; onComplete: (p: Perfil) => void }) => {
  const [form, setForm] = useState<Perfil>({ nombre: "", email: "", edad: "", pais: "", condicion: "" });
  const [touched, setTouched] = useState(false);
  const nombreOk = form.nombre.trim() !== "";
  const correoOk = emailValido(form.email);
  const valido = nombreOk && correoOk;

  const inputBase = {
    width: "100%",
    padding: "13px 14px",
    border: `1px solid ${T.border}`,
    borderRadius: "10px",
    fontSize: "14px",
    boxSizing: "border-box" as const,
    background: T.white,
    color: T.ink,
  };

  const submit = () => {
    setTouched(true);
    if (valido && !loading) onComplete(form);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        background: T.cream,
      }}
    >
      <div className="rise" style={{ maxWidth: "440px", width: "100%", animationDelay: "0.04s" }}>
        <div style={{ marginBottom: "10px" }}>
          <Header />
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 12px",
            background: intent === "subscribe" ? "rgba(184,146,42,0.12)" : "rgba(45,125,111,0.1)",
            color: intent === "subscribe" ? T.goldDark : T.teal,
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 700,
            margin: "20px 0 14px",
          }}
        >
          {intent === "subscribe" ? "Paso final · Activar Vitalis Pro" : "Paso 1 de 2 · Tu perfil"}
        </div>
        <h2 style={{ fontFamily: display, fontSize: "27px", fontWeight: 600, color: T.charcoal, margin: "0 0 8px" }}>
          Información personal
        </h2>
        <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 26px", lineHeight: 1.55 }}>
          {intent === "subscribe"
            ? "Confirma tus datos para activar Vitalis Pro. El cobro se realiza de forma segura con Stripe."
            : "Confidencial. Nos ayuda a personalizar la orientación del Dr. Vitalis."}
        </p>

        <div style={{ marginBottom: "14px" }}>
          <input
            className="field"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            style={{ ...inputBase, borderColor: touched && !nombreOk ? "#C0492F" : T.border }}
          />
          {touched && !nombreOk && (
            <div style={{ fontSize: "12px", color: "#C0492F", marginTop: "6px" }}>Indica tu nombre para continuar.</div>
          )}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <input
            className="field"
            placeholder="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{ ...inputBase, borderColor: touched && !correoOk ? "#C0492F" : T.border }}
          />
          {touched && !correoOk && (
            <div style={{ fontSize: "12px", color: "#C0492F", marginTop: "6px" }}>Escribe un correo electrónico válido.</div>
          )}
        </div>

        <input
          className="field"
          placeholder="Edad"
          inputMode="numeric"
          value={form.edad}
          onChange={(e) => setForm({ ...form, edad: e.target.value })}
          style={{ ...inputBase, marginBottom: "14px" }}
        />
        <input
          className="field"
          placeholder="País"
          value={form.pais}
          onChange={(e) => setForm({ ...form, pais: e.target.value })}
          style={{ ...inputBase, marginBottom: "14px" }}
        />
        <input
          className="field"
          placeholder="Condición o motivo de consulta"
          value={form.condicion}
          onChange={(e) => setForm({ ...form, condicion: e.target.value })}
          style={{ ...inputBase, marginBottom: "20px" }}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="btn btn-primary"
          style={{
            width: "100%",
            padding: "15px",
            background: loading ? T.border : T.gold,
            color: T.white,
            border: "none",
            borderRadius: "999px",
            cursor: loading ? "wait" : "pointer",
            fontSize: "15px",
            fontWeight: 700,
          }}
        >
          {loading
            ? "Redirigiendo a pago seguro..."
            : intent === "subscribe"
              ? `Continuar al pago — ${PRECIO}/mes`
              : "Continuar a la consulta"}
        </button>
        <p style={{ fontSize: "12px", color: T.muted, textAlign: "center", margin: "16px 0 0", lineHeight: 1.5 }}>
          Tu información es confidencial y se usa solo para personalizar tu acompañamiento.
        </p>
      </div>
    </div>
  );
};

const SUGERENCIAS = [
  "Tengo dudas sobre disfunción eréctil",
  "¿Qué ejercicios me recomiendas?",
  "Quiero revisar mi medicación",
];

const ChatView = ({ perfil, onSubscribe, subscribing }: { perfil: Perfil; onSubscribe: () => void; subscribing: boolean }) => {
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { role: "assistant", content: `Buenas tardes, ${perfil.nombre || "paciente"}. Soy el Dr. Vitalis. ¿En qué puedo ayudarle hoy?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const preguntasUsadas = msgs.filter((m) => m.role === "user").length;
  const limiteAlcanzado = preguntasUsadas >= FREE_QUESTION_LIMIT;

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    if (limiteAlcanzado) {
      setMsgs((p) => {
        const ultimo = p[p.length - 1];
        if (ultimo?.role === "assistant" && ultimo.content === LIMIT_MESSAGE) return p;
        return [...p, { role: "assistant", content: LIMIT_MESSAGE }];
      });
      return;
    }
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
      setMsgs((p) => [
        ...p,
        {
          role: "assistant",
          content: data.reply || (data.limited ? LIMIT_MESSAGE : "Disculpe, no pude responder en este momento."),
        },
      ]);
    } catch {
      setMsgs((p) => [...p, { role: "assistant", content: "Error de conexión. Intente nuevamente en unos segundos." }]);
    }
    setLoading(false);
  };

  const soloSaludo = msgs.length === 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: T.cream }}>
      <div
        style={{
          padding: "14px 18px",
          background: T.white,
          borderBottom: `1px solid ${T.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
          <Monogram size={34} />
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: T.charcoal }}>Dr. Vitalis</div>
            <div style={{ fontSize: "11px", color: T.teal, display: "flex", alignItems: "center", gap: "5px" }}>
              <span className="status-online" style={{ width: "7px", height: "7px", borderRadius: "999px", background: T.teal }} />
              En línea · Urología
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(184,146,42,0.08)",
          borderBottom: `1px solid ${T.border}`,
          padding: "11px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "12.5px", color: T.ink }}>
          {limiteAlcanzado
            ? "Test gratuito completado. Activa Vitalis Pro para seguir consultando al Dr. Vitalis."
            : `Test gratuito: ${preguntasUsadas}/${FREE_QUESTION_LIMIT} consultas usadas. Activa Vitalis Pro para consultas ilimitadas.`}
        </span>
        <button
          onClick={onSubscribe}
          disabled={subscribing}
          className="btn btn-primary"
          style={{
            padding: "9px 18px",
            background: T.gold,
            color: T.white,
            border: "none",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: subscribing ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {subscribing ? "Procesando..." : `Suscribirme — ${PRECIO}/mes`}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ maxWidth: "760px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          {msgs.map((m, i) => (
            <div key={i} className="fade" style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div
                style={{
                  maxWidth: "82%",
                  padding: "12px 16px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? T.charcoal : T.white,
                  color: m.role === "user" ? T.white : T.ink,
                  fontSize: "14.5px",
                  lineHeight: 1.55,
                  border: m.role === "assistant" ? `1px solid ${T.border}` : "none",
                  whiteSpace: "pre-wrap",
                  boxShadow: m.role === "assistant" ? "0 2px 10px -8px rgba(27,27,29,0.4)" : "none",
                }}
              >
                {m.content}
              </div>
            </div>
          ))}

          {soloSaludo && !loading && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingTop: "4px" }}>
              {SUGERENCIAS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="chip"
                  style={{
                    padding: "9px 14px",
                    background: T.cream,
                    color: T.ink,
                    border: `1px solid ${T.border}`,
                    borderRadius: "999px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "13px 16px",
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  borderRadius: "16px 16px 16px 4px",
                }}
              >
                <span className="dot" style={{ width: "7px", height: "7px", borderRadius: "999px", background: T.muted }} />
                <span className="dot" style={{ width: "7px", height: "7px", borderRadius: "999px", background: T.muted }} />
                <span className="dot" style={{ width: "7px", height: "7px", borderRadius: "999px", background: T.muted }} />
              </div>
            </div>
          )}
          {limiteAlcanzado && !loading && (
            <div
              className="fade"
              style={{
                background: T.white,
                border: `1px solid ${T.gold}`,
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ maxWidth: "520px" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: T.charcoal, marginBottom: "4px" }}>
                  Test gratuito completado
                </div>
                <div style={{ fontSize: "13px", color: T.muted, lineHeight: 1.45 }}>
                  Para continuar la consulta, recibir tu protocolo y dar seguimiento a tu progreso, activa Vitalis Pro.
                </div>
              </div>
              <button
                onClick={onSubscribe}
                disabled={subscribing}
                className="btn btn-primary"
                style={{
                  padding: "11px 18px",
                  background: T.gold,
                  color: T.white,
                  border: "none",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: subscribing ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {subscribing ? "Procesando..." : `Activar Pro — ${PRECIO}/mes`}
              </button>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border}`, background: T.white }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", gap: "10px" }}>
          <input
            className="field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={limiteAlcanzado ? "Activa Vitalis Pro para continuar..." : "Escriba su consulta..."}
            disabled={limiteAlcanzado}
            onKeyDown={(e) => {
              if (e.key === "Enter") send(input);
            }}
            style={{ flex: 1, padding: "13px 15px", border: `1px solid ${T.border}`, borderRadius: "999px", fontSize: "14px", background: T.cream, color: T.ink }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading || limiteAlcanzado}
            className="btn btn-primary"
            style={{
              padding: "12px 24px",
              background: !input.trim() || loading || limiteAlcanzado ? T.border : T.gold,
              color: T.white,
              border: "none",
              borderRadius: "999px",
              cursor: !input.trim() || loading || limiteAlcanzado ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<"landing" | "onboarding" | "chat" | "success">("landing");
  const [perfil, setPerfil] = useState<Perfil>({ nombre: "", email: "", edad: "", pais: "", condicion: "" });
  const [intent, setIntent] = useState<Intent>("chat");
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "true") {
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
    if (intent === "subscribe") {
      irACheckout(p);
    } else {
      setScreen("chat");
    }
  };

  return (
    <>
      {screen === "landing" && (
        <Landing
          onStart={() => {
            setIntent("chat");
            setScreen("onboarding");
          }}
          onSubscribe={() => {
            setIntent("subscribe");
            setScreen("onboarding");
          }}
        />
      )}
      {screen === "onboarding" && <Onboarding intent={intent} loading={redirecting} onComplete={completarOnboarding} />}
      {screen === "chat" && (
        <ChatView
          perfil={perfil}
          subscribing={redirecting}
          onSubscribe={() => {
            setIntent("subscribe");
            irACheckout(perfil);
          }}
        />
      )}
      {screen === "success" && <SuccessBanner onContinue={() => setScreen(perfil.nombre ? "chat" : "onboarding")} />}
    </>
  );
}
