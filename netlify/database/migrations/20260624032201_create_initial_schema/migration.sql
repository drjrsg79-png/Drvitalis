CREATE TABLE "adherencia" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL,
	"fecha" date DEFAULT now(),
	"ejercicios_completados" integer DEFAULT 0,
	"dosis_tomadas" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_history" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL,
	"messages" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protocolo" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"medicamentos" jsonb DEFAULT '[]',
	"ejercicios" jsonb DEFAULT '[]',
	"notas_medicas" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY,
	"email" text NOT NULL UNIQUE,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'inactive',
	"plan" text DEFAULT 'pro',
	"precio" integer DEFAULT 599,
	"moneda" text DEFAULT 'mxn',
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"identity_id" text,
	"email" text NOT NULL UNIQUE,
	"nombre" text,
	"edad" text,
	"pais" text,
	"condicion" text,
	"onboarding_completo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX "adherencia_email_fecha_idx" ON "adherencia" ("email","fecha");