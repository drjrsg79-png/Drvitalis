'use client';
import { useState, useRef, useEffect } from "react";
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
const PERFIL_VACIO: Perfil = { nombre: "", email: "", edad: "", pais: "", condicion: "" };

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
      <p style={{ fontSize: "13px", color: T.muted, marginTop: "16px" }}>Crea tu cuenta, activa el acceso completo al Dr. Vitalis y a tu protocolo. Cancela cuando quieras.</p>
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
          ["1", "Crea tu cuenta", "Regístrate con tu correo y contraseña para tener un acceso seguro y privado a tu historial."],
          ["2", "Activa tu suscripción", "Completas el pago seguro con Stripe para desbloquear Vitalis Pro."],
          ["3", "Sigue tu protocolo", "Hablas con el Dr. Vitalis y accedes a tu plan completo con ejercicios guiados en video."],
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
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
        )}
        <input placeholder="Correo electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") enviar(); }} style={inputStyle} />

        {error && <div style={{ fontSize: "13px", color: "#B23A2A", marginBottom: "12px" }}>{error}</div>}
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
  const [form, setForm] = useState<Perfil>(inicial);
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
        <input placeholder="Correo electrónico" type="email" value={form.email} readOnly style={{ ...inputStyle, background: "#F2EFEA", color: T.muted }} />
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

const ChatView = ({ perfil, onExercises, onLogout }: { perfil: Perfil; onExercises: () => void; onLogout: () => void }) => {
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
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onExercises} style={{ padding: "8px 16px", background: "transparent", color: T.charcoal, border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Ejercicios guiados</button>
          <button onClick={onLogout} style={{ padding: "8px 16px", background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Salir</button>
        </div>
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
  const [screen, setScreen] = useState<"landing" | "auth" | "onboarding" | "chat" | "ejercicios" | "success">("landing");
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
          setScreen(exito ? "success" : "chat");
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
      setScreen("chat");
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
    setScreen(cuenta.subscribed ? "chat" : "onboarding");
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
      {screen === "chat" && (
        <ChatView perfil={perfil} onExercises={() => setScreen("ejercicios")} onLogout={cerrarSesion} />
      )}
      {screen === "ejercicios" && <Ejercicios onBack={() => setScreen("chat")} />}
      {screen === "success" && <SuccessBanner onContinue={() => setScreen(perfil.nombre ? "chat" : "onboarding")} />}
    </>
  );
}
