import { getDatabase, type DatabaseConnection } from "@netlify/database";

// Conexion perezosa a la base de datos de Netlify (Postgres). Se inicializa la
// primera vez que se usa, no al importar el modulo, para no romper el build
// cuando NETLIFY_DATABASE_URL aun no esta presente.
let _db: DatabaseConnection | null = null;

export function getDb(): DatabaseConnection {
  if (!_db) {
    _db = getDatabase();
  }
  return _db;
}

export type UserRow = {
  id: number;
  email: string;
  nombre: string | null;
  edad: number | null;
  pais: string | null;
  condicion: string | null;
};

// Inserta o actualiza el perfil del paciente identificado por su email y
// devuelve la fila resultante. Es la base sobre la que se cuelgan las
// suscripciones y el resto de datos del paciente.
export async function upsertUser(perfil: {
  email: string;
  nombre?: string | null;
  edad?: number | null;
  pais?: string | null;
  condicion?: string | null;
}): Promise<UserRow> {
  const db = getDb();
  const [row] = await db.sql<UserRow>`
    INSERT INTO users (email, nombre, edad, pais, condicion)
    VALUES (${perfil.email}, ${perfil.nombre ?? null}, ${perfil.edad ?? null}, ${perfil.pais ?? null}, ${perfil.condicion ?? null})
    ON CONFLICT (email) DO UPDATE SET
      nombre = COALESCE(EXCLUDED.nombre, users.nombre),
      edad = COALESCE(EXCLUDED.edad, users.edad),
      pais = COALESCE(EXCLUDED.pais, users.pais),
      condicion = COALESCE(EXCLUDED.condicion, users.condicion),
      updated_at = NOW()
    RETURNING id, email, nombre, edad, pais, condicion
  `;
  return row;
}
