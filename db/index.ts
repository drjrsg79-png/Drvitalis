// Cliente de Drizzle sobre la base de datos gestionada de Netlify.
// La conexión se configura sola a partir de las variables de entorno que
// Netlify inyecta en tiempo de ejecución; no hace falta cadena de conexión.
import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema";

export const db = drizzle({ schema });
