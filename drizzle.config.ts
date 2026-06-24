import { defineConfig } from "drizzle-kit";

// Las migraciones DEBEN generarse en netlify/database/migrations para que
// Netlify las aplique automáticamente durante el deploy.
export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema.ts",
  out: "netlify/database/migrations",
});
