// Esquema de la base de datos gestionada de Netlify (Postgres) para Vitalis.
// Las tablas se enlazan por el email del paciente: es el dato que comparten
// Netlify Identity (autenticación) y Stripe (webhook de pago), lo que permite
// reconocer al mismo usuario en ambos flujos sin depender de un id externo.
import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Perfil médico del paciente. El email es único y actúa como clave de enlace.
export const users = pgTable("users", {
  id: serial().primaryKey(),
  // Id del usuario en Netlify Identity (cuando inicia sesión). Puede ser null
  // si la fila se creó primero desde el webhook de Stripe.
  identityId: text("identity_id"),
  email: text().notNull().unique(),
  nombre: text(),
  edad: text(),
  pais: text(),
  condicion: text(),
  onboardingCompleto: boolean("onboarding_completo").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suscripción a Vitalis Pro. Se inserta/actualiza desde el webhook de Stripe.
export const subscriptions = pgTable("subscriptions", {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text().default("inactive"),
  plan: text().default("pro"),
  precio: integer().default(599),
  moneda: text().default("mxn"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Historial de consultas con el Dr. Vitalis.
export const chatHistory = pgTable("chat_history", {
  id: serial().primaryKey(),
  email: text().notNull(),
  messages: jsonb().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Registro diario de adherencia al protocolo (un registro por día y paciente).
export const adherencia = pgTable(
  "adherencia",
  {
    id: serial().primaryKey(),
    email: text().notNull(),
    fecha: date().defaultNow(),
    ejerciciosCompletados: integer("ejercicios_completados").default(0),
    dosisTomadas: integer("dosis_tomadas").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [uniqueIndex("adherencia_email_fecha_idx").on(t.email, t.fecha)],
);

// Protocolo médico personalizado del paciente (uno por paciente).
export const protocolo = pgTable("protocolo", {
  id: serial().primaryKey(),
  email: text().notNull().unique(),
  medicamentos: jsonb().default([]),
  ejercicios: jsonb().default([]),
  notasMedicas: text("notas_medicas"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
