'use client';
import { useState, useRef, useEffect } from "react";

const T = {
  cream: "#F7F4EE",
  creamDeep: "#EFE9DF",
  charcoal: "#1B1B1D",
  gold: "#B8922A",
  goldButton: "#8A6C1B",
  goldDark: "#9A7A1F",
  white: "#FFFFFF",
  ink: "#2E2E30",
  border: "#E2DCCF",
  muted: "#716D67",
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

type AuthUsuario = {
  id: string;
  email: string;
  nombre: string | null;
  edad: number | null;
  pais: string | null;
  condicion: string | null;
  suscripcionActiva: boolean;
};

const PRECIO = "$599 MXN";

const emailValido = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

async function cerrarSesion(): Promise<void> {
  try {
    await fetch("/api/auth/salir", { method: "POST" });
  } catch {
    // Si falla la llamada, la página se recarga igual y el usuario queda
    // sin sesión visible en el siguiente chequeo de /api/auth/yo.
  }
}

// Abre el Customer Portal de Stripe (administrar suscripción: cancelar, ver
// facturas, cambiar método de pago). Devuelve true si pudo redirigir, false
// si hubo un error — en ese caso el llamador debe mostrar el mensaje al usuario.
async function abrirPortalSuscripcion(): Promise<string | null> {
  try {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.url) {
      return data.url as string;
    }
    return null;
  } catch {
    return null;
  }
}

const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const solicitar = async () => {
    if (!emailValido(email)) {
      setError("Ingrese un correo válido.");
      return;
    }
    setError("");
    setEnviando(true);
    try {
      const res = await fetch("/api/auth/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setEnviado(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo enviar el enlace. Intente de nuevo.");
      }
    } catch {
      setError("Error de conexión. Intente de nuevo.");
    }
    setEnviando(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Iniciar sesión"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(27,27,29,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          borderRadius: "20px",
          padding: "32px 28px",
          maxWidth: "380px",
          width: "100%",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.4)",
        }}
      >
        {enviado ? (
          <>
            <h3 style={{ fontFamily: display, fontSize: "20px", color: T.charcoal, margin: "0 0 10px" }}>
              Revise su correo
            </h3>
            <p style={{ fontSize: "14px", color: T.muted, lineHeight: 1.55, margin: "0 0 20px" }}>
              Le enviamos un enlace de acceso a <strong>{email}</strong>. Tóquelo desde su correo para
              entrar — es válido durante 15 minutos.
            </p>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{
                width: "100%",
                padding: "13px",
                background: "transparent",
                color: T.charcoal,
                border: `1px solid ${T.border}`,
                borderRadius: "999px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h3 style={{ fontFamily: display, fontSize: "20px", color: T.charcoal, margin: "0 0 10px" }}>
              Iniciar sesión
            </h3>
            <p style={{ fontSize: "14px", color: T.muted, lineHeight: 1.55, margin: "0 0 18px" }}>
              Ingrese su correo y le enviaremos un enlace de acceso seguro, sin contraseña.
            </p>
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="su@correo.com"
              aria-label="Correo electrónico"
              onKeyDown={(e) => {
                if (e.key === "Enter") solicitar();
              }}
              style={{
                width: "100%",
                padding: "13px 15px",
                border: `1px solid ${T.border}`,
                borderRadius: "999px",
                fontSize: "14px",
                background: T.cream,
                color: T.ink,
                marginBottom: "10px",
                boxSizing: "border-box",
              }}
            />
            {error && (
              <p style={{ color: "#B3261E", fontSize: "12.5px", margin: "0 0 10px" }}>{error}</p>
            )}
            <button
              onClick={solicitar}
              disabled={enviando}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                background: T.goldButton,
                color: T.white,
                border: "none",
                borderRadius: "999px",
                fontWeight: 700,
                cursor: enviando ? "wait" : "pointer",
                marginBottom: "10px",
              }}
            >
              {enviando ? "Enviando..." : "Enviar enlace de acceso"}
            </button>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{
                width: "100%",
                padding: "11px",
                background: "transparent",
                color: T.muted,
                border: "none",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
};

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

const Landing = ({
  onStart,
  onSubscribe,
  auth,
  onOpenLogin,
  onLogout,
  onAbrirPortal,
  portalCargando,
}: {
  onStart: () => void;
  onSubscribe: () => void;
  auth: AuthUsuario | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onAbrirPortal: () => void;
  portalCargando: boolean;
}) => (
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
          gap: "10px",
        }}
      >
        <Header />
        {auth ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12.5px", color: T.muted, display: "none" }} className="auth-email-desktop">
              {auth.email}
            </span>
            {auth.suscripcionActiva && (
              <button
                onClick={onAbrirPortal}
                disabled={portalCargando}
                className="btn btn-ghost"
                style={{
                  padding: "10px 18px",
                  background: "transparent",
                  color: T.charcoal,
                  border: `1px solid ${T.border}`,
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: portalCargando ? "wait" : "pointer",
                }}
              >
                {portalCargando ? "Abriendo..." : "Administrar suscripción"}
              </button>
            )}
            <button
              onClick={onLogout}
              className="btn btn-ghost"
              style={{
                padding: "10px 18px",
                background: "transparent",
                color: T.charcoal,
                border: `1px solid ${T.border}`,
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
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
            Iniciar sesión
          </button>
        )}
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
            El Dr. Vitalis es un asistente clínico de IA en salud sexual masculina que entiende tu caso, te orienta de
            forma privada y te acompaña con ejercicios terapéuticos y seguimiento de tu progreso — y te guía con
            claridad hacia consulta presencial cuando tu caso lo requiere.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={onStart}
              className="btn btn-primary"
              style={{
                padding: "15px 32px",
                background: T.goldButton,
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
            ["02", "Orientación personalizada", "Según tu edad, país y condición, recibes orientación clara sobre tu caso y ejercicios terapéuticos."],
            ["03", "Seguimiento de tu progreso", "Lleva el control de ejercicios completados y avances para mejorar tus resultados con el tiempo."],
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
            ["3", "Active Vitalis Pro cuando esté listo", `Por ${PRECIO}/mes, consultas ilimitadas, ejercicios guiados y seguimiento continuo. Cancele cuando quiera.`],
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
            ["La orientación fue clara desde el principio: entendí qué opciones tenía y cuándo acudir a consulta. Noté cambios en semanas.", "Roberto V.", "53 años · Monterrey"],
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
            {["Consultas ilimitadas 24/7", "Orientación clínica clara sobre tu caso", "Ejercicios terapéuticos guiados", "Seguimiento de tu progreso"].map((f) => (
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
            disabled={!!auth?.suscripcionActiva}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "16px",
              background: auth?.suscripcionActiva ? T.border : T.gold,
              color: auth?.suscripcionActiva ? T.muted : T.white,
              border: "none",
              borderRadius: "999px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: auth?.suscripcionActiva ? "default" : "pointer",
            }}
          >
            {auth?.suscripcionActiva ? "Ya tienes Vitalis Pro ✓" : "Activar Vitalis Pro"}
          </button>
          {!auth?.suscripcionActiva && (
            <p
              style={{
                fontSize: "12.5px",
                color: T.teal,
                fontWeight: 700,
                margin: "14px 0 0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
              }}
            >
              <span>🔒</span> Sin compromiso — cancele en un toque cuando quiera
            </p>
          )}
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
            ["¿Puedo cancelar cuando quiera?", "Por supuesto. La suscripción es mensual y puedes cancelarla en cualquier momento, sin penalizaciones ni preguntas."],
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
        <div
          style={{
            maxWidth: "560px",
            margin: "16px auto 0",
            paddingTop: "14px",
            borderTop: `1px solid ${T.border}`,
          }}
        >
          <p style={{ fontSize: "12.5px", color: T.ink, fontWeight: 700, margin: "0 0 4px" }}>
            Dr. José Rogelio Sánchez García
          </p>
          <p style={{ fontSize: "11.5px", color: T.muted, margin: "0 0 2px", lineHeight: 1.5 }}>
            Especialista en Medicina Interna y Terapia Intensiva · Diplomado en Andrología
          </p>
          <p style={{ fontSize: "11.5px", color: T.muted, margin: "0 0 2px" }}>
            Céd. Prof. 4273375 / 6525546 · Centro de Salud Sexual Masculina
          </p>
          <p style={{ fontSize: "11px", color: T.muted, margin: "8px 0 0", lineHeight: 1.5 }}>
            Vitalis es un asistente clínico digital desarrollado bajo el enfoque médico del Dr. José Rogelio Sánchez García.
          </p>
        </div>
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
        background: T.goldButton,
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

const Onboarding = ({
  intent,
  loading,
  onComplete,
  correoFijo,
  perfilPrevio,
}: {
  intent: Intent;
  loading: boolean;
  onComplete: (p: Perfil) => void;
  correoFijo?: string;
  perfilPrevio?: Perfil;
}) => {
  const [form, setForm] = useState<Perfil>({
    nombre: perfilPrevio?.nombre || "",
    email: correoFijo || perfilPrevio?.email || "",
    edad: perfilPrevio?.edad || "",
    pais: perfilPrevio?.pais || "",
    condicion: perfilPrevio?.condicion || "",
  });
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
    if (intent === "chat") {
      if (nombreOk && !loading) onComplete(form);
      return;
    }
    if (valido && !loading) onComplete(form);
  };

  // Para el flujo de chat gratuito, el onboarding se reduce a un solo campo
  // (nombre) para minimizar la fricción antes de la primera conversación.
  // El correo se pide después, cuando el usuario llega al límite gratuito o
  // decide suscribirse — en ese punto ya está comprometido con el producto y
  // el costo de pedir el dato es mucho menor.
  if (intent === "chat") {
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
        <div className="rise" style={{ maxWidth: "420px", width: "100%", animationDelay: "0.04s" }}>
          <div style={{ marginBottom: "10px" }}>
            <Header />
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 12px",
              background: "rgba(45,125,111,0.1)",
              color: T.teal,
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 700,
              margin: "20px 0 14px",
            }}
          >
            Antes de comenzar
          </div>
          <h2 style={{ fontFamily: display, fontSize: "27px", fontWeight: 600, color: T.charcoal, margin: "0 0 8px" }}>
            ¿Cómo le llamamos?
          </h2>
          <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 22px", lineHeight: 1.55 }}>
            Solo eso, para empezar. Todo lo demás se lo preguntará el Dr. Vitalis en la conversación.
          </p>

          <div style={{ marginBottom: "18px" }}>
            <input
              className="field"
              placeholder="Nombre"
              value={form.nombre}
              autoFocus
              aria-label="Nombre"
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              style={{ ...inputBase, fontSize: "16px", padding: "15px 16px", borderColor: touched && !nombreOk ? "#C0492F" : T.border }}
            />
            {touched && !nombreOk && (
              <div style={{ fontSize: "12px", color: "#C0492F", marginTop: "6px" }}>Indica tu nombre para continuar.</div>
            )}
          </div>

          <button
            onClick={submit}
            className="btn btn-primary"
            style={{
              width: "100%",
              padding: "15px",
              background: T.goldButton,
              color: T.white,
              border: "none",
              borderRadius: "999px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 700,
            }}
          >
            Empezar a conversar
          </button>
          <p style={{ fontSize: "12px", color: T.muted, textAlign: "center", margin: "16px 0 0", lineHeight: 1.5 }}>
            Confidencial. Su correo solo se pedirá si decide continuar con Vitalis Pro.
          </p>
        </div>
      </div>
    );
  }

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
            background: "rgba(184,146,42,0.12)",
            color: T.goldDark,
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: 700,
            margin: "20px 0 14px",
          }}
        >
          Paso final · Activar Vitalis Pro
        </div>
        <h2 style={{ fontFamily: display, fontSize: "27px", fontWeight: 600, color: T.charcoal, margin: "0 0 8px" }}>
          Información personal
        </h2>
        <p style={{ fontSize: "14px", color: T.muted, margin: "0 0 26px", lineHeight: 1.55 }}>
          Confirma tus datos para activar Vitalis Pro. El cobro se realiza de forma segura con Stripe.
        </p>

        <div style={{ marginBottom: "14px" }}>
          <input
            className="field"
            placeholder="Nombre"
            value={form.nombre}
            aria-label="Nombre"
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
            disabled={!!correoFijo}
            aria-label="Correo electrónico"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={{
              ...inputBase,
              borderColor: touched && !correoOk ? "#C0492F" : T.border,
              background: correoFijo ? T.creamDeep : T.white,
              color: correoFijo ? T.muted : T.ink,
            }}
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
          aria-label="Edad"
          onChange={(e) => setForm({ ...form, edad: e.target.value })}
          style={{ ...inputBase, marginBottom: "14px" }}
        />
        <input
          className="field"
          placeholder="País"
          value={form.pais}
          aria-label="País"
          onChange={(e) => setForm({ ...form, pais: e.target.value })}
          style={{ ...inputBase, marginBottom: "14px" }}
        />
        <input
          className="field"
          placeholder="Condición o motivo de consulta"
          value={form.condicion}
          aria-label="Condición o motivo de consulta"
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
          {loading ? "Redirigiendo a pago seguro..." : `Continuar al pago — ${PRECIO}/mes`}
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
  "¿Qué tipos de tratamiento existen para mi caso?",
];

const ChatView = ({
  perfil,
  onSubscribe,
  subscribing,
  auth,
  onLogout,
  onAbrirPortal,
  portalCargando,
}: {
  perfil: Perfil;
  onSubscribe: () => void;
  subscribing: boolean;
  auth: AuthUsuario | null;
  onLogout: () => void;
  onAbrirPortal: () => void;
  portalCargando: boolean;
}) => {
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    { role: "assistant", content: `Buenas tardes, ${perfil.nombre || "paciente"}. Soy el Dr. Vitalis. ¿En qué puedo ayudarle hoy?` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading || limiteAlcanzado) return;
    const newMsgs: ChatMessage[] = [...msgs, { role: "user", content: text }];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/vitalis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          perfil: {
            nombre: perfil.nombre,
            edad: perfil.edad,
            pais: perfil.pais,
            condicion: perfil.condicion,
          },
          messages: newMsgs,
        }),
      });
      const data = await res.json();
      setMsgs((p) => [...p, { role: "assistant", content: data.reply || "Disculpe, no pude responder en este momento." }]);
      if (data.limite_alcanzado) {
        setLimiteAlcanzado(true);
      }
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
              En línea · Dr. José Rogelio Sánchez García
            </div>
          </div>
        </div>
        {auth && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {auth.suscripcionActiva && (
              <button
                onClick={onAbrirPortal}
                disabled={portalCargando}
                style={{
                  padding: "8px 14px",
                  background: "transparent",
                  color: T.muted,
                  border: `1px solid ${T.border}`,
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: portalCargando ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {portalCargando ? "Abriendo..." : "Administrar suscripción"}
              </button>
            )}
            <button
              onClick={onLogout}
              style={{
                padding: "8px 14px",
                background: "transparent",
                color: T.muted,
                border: `1px solid ${T.border}`,
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {!auth?.suscripcionActiva && (
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
          <span style={{ fontSize: "12.5px", color: T.ink }}>Activa Vitalis Pro para consultas ilimitadas y seguimiento completo.</span>
          <button
            onClick={onSubscribe}
            disabled={subscribing}
            className="btn btn-primary"
            style={{
              padding: "9px 18px",
              background: T.goldButton,
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
      )}

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

          {soloSaludo && !loading && !limiteAlcanzado && (
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
          <div ref={endRef} />
        </div>
      </div>

      <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.border}`, background: T.white }}>
        {limiteAlcanzado ? (
          <div
            style={{
              maxWidth: "760px",
              margin: "0 auto",
              background: "rgba(184,146,42,0.08)",
              border: `1px solid ${T.gold}`,
              borderRadius: "16px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
              <Monogram size={28} />
              <div>
                <p style={{ fontSize: "13.5px", color: T.ink, fontWeight: 700, margin: "0 0 3px" }}>
                  Ha usado sus 3 consultas gratuitas
                </p>
                <p style={{ fontSize: "13px", color: T.muted, margin: 0, lineHeight: 1.5 }}>
                  Para que sigamos revisando su caso sin interrupciones — y con seguimiento de su progreso —
                  active Vitalis Pro. Toma menos de un minuto.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", color: T.teal, fontWeight: 700 }}>🔒 Sin compromiso — cancele cuando quiera</span>
              <button
                onClick={onSubscribe}
                disabled={subscribing}
                className="btn btn-primary"
                style={{
                  padding: "12px 24px",
                  background: T.goldButton,
                  color: T.white,
                  border: "none",
                  borderRadius: "999px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: subscribing ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {subscribing ? "Procesando..." : `Continuar con Vitalis Pro — ${PRECIO}/mes`}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", gap: "10px" }}>
            <input
              className="field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escriba su consulta..."
              aria-label="Escriba su consulta"
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
              style={{ flex: 1, padding: "13px 15px", border: `1px solid ${T.border}`, borderRadius: "999px", fontSize: "14px", background: T.cream, color: T.ink }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="btn btn-primary"
              style={{
                padding: "12px 24px",
                background: !input.trim() || loading ? T.border : T.gold,
                color: T.white,
                border: "none",
                borderRadius: "999px",
                cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Enviar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [screen, setScreen] = useState<"landing" | "onboarding" | "chat" | "success">("landing");
  const [perfil, setPerfil] = useState<Perfil>({ nombre: "", email: "", edad: "", pais: "", condicion: "" });
  const [intent, setIntent] = useState<Intent>("chat");
  const [redirecting, setRedirecting] = useState(false);
  const [auth, setAuth] = useState<AuthUsuario | null>(null);
  const [authCargado, setAuthCargado] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [authAviso, setAuthAviso] = useState<string | null>(null);
  const [portalCargando, setPortalCargando] = useState(false);

  const consultarSesion = async () => {
    try {
      const res = await fetch("/api/auth/yo");
      const data = await res.json();
      if (data.autenticado) {
        setAuth(data.usuario);
        // Si ya hay sesión y perfil médico guardado, se usa para precargar
        // el chat directamente sin pedirlo otra vez.
        if (data.usuario.nombre) {
          setPerfil({
            nombre: data.usuario.nombre || "",
            email: data.usuario.email || "",
            edad: data.usuario.edad ? String(data.usuario.edad) : "",
            pais: data.usuario.pais || "",
            condicion: data.usuario.condicion || "",
          });
        }
      } else {
        setAuth(null);
      }
    } catch {
      setAuth(null);
    }
    setAuthCargado(true);
  };

  useEffect(() => {
    consultarSesion();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "true") {
      setScreen("success");
      window.history.replaceState({}, "", "/");
      // Tras un pago exitoso se refresca el estado de sesión para reflejar
      // la suscripción activa de inmediato.
      consultarSesion();
    }

    const authParam = params.get("auth");
    if (authParam === "ok") {
      setAuthAviso("Sesión iniciada correctamente.");
      window.history.replaceState({}, "", "/");
      consultarSesion();
    } else if (authParam === "expirado") {
      setAuthAviso("El enlace expiró o ya fue usado. Solicite uno nuevo.");
      window.history.replaceState({}, "", "/");
    } else if (authParam === "error") {
      setAuthAviso("No se pudo iniciar sesión. Intente de nuevo.");
      window.history.replaceState({}, "", "/");
    }

    if (params.get("portal") === "ok") {
      window.history.replaceState({}, "", "/");
      // Tras volver del portal de Stripe, se refresca el estado de sesión:
      // si el usuario canceló ahí, el botón de pago debe volver a aparecer.
      consultarSesion();
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

  const manejarLogout = async () => {
    await cerrarSesion();
    setAuth(null);
    setScreen("landing");
  };

  const manejarAbrirPortal = async () => {
    setPortalCargando(true);
    const url = await abrirPortalSuscripcion();
    if (url) {
      window.location.href = url;
    } else {
      setPortalCargando(false);
      alert("No se pudo abrir el portal de administración. Intente de nuevo en unos segundos.");
    }
  };

  // Mientras se confirma si hay sesión activa, se evita parpadear el botón
  // de pago: no se muestra nada del estado de Pro hasta saberlo con certeza.
  if (!authCargado) {
    return (
      <div style={{ minHeight: "100vh", background: T.cream }} />
    );
  }

  return (
    <>
      {authAviso && (
        <div
          style={{
            position: "fixed",
            top: "14px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            background: T.charcoal,
            color: T.white,
            padding: "11px 20px",
            borderRadius: "999px",
            fontSize: "13px",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
          }}
          onClick={() => setAuthAviso(null)}
        >
          {authAviso}
        </div>
      )}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
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
          auth={auth}
          onOpenLogin={() => setShowLogin(true)}
          onLogout={manejarLogout}
          onAbrirPortal={manejarAbrirPortal}
          portalCargando={portalCargando}
        />
      )}
      {screen === "onboarding" && (
        <Onboarding
          intent={intent}
          loading={redirecting}
          onComplete={completarOnboarding}
          correoFijo={auth?.email}
          perfilPrevio={perfil}
        />
      )}
      {screen === "chat" && (
        <ChatView
          perfil={perfil}
          subscribing={redirecting}
          onSubscribe={() => {
            setIntent("subscribe");
            // Si ya se tiene correo (por sesión activa o captura previa), se
            // va directo a Stripe. Si no, se pide el formulario completo de
            // pago primero — el chat gratuito solo capturó el nombre.
            if (perfil.email && emailValido(perfil.email)) {
              irACheckout(perfil);
            } else {
              setScreen("onboarding");
            }
          }}
          auth={auth}
          onLogout={manejarLogout}
          onAbrirPortal={manejarAbrirPortal}
          portalCargando={portalCargando}
        />
      )}
      {screen === "success" && <SuccessBanner onContinue={() => setScreen(perfil.nombre ? "chat" : "onboarding")} />}
    </>
  );
}
