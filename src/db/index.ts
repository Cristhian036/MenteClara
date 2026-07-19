import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.ts';

const { Pool } = pg;

// Función para crear un nuevo pool de conexiones.
export const createPool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return new Pool({
      connectionString,
      ssl: connectionString.includes('render.com') || process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 15000,
    });
  }
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: process.env.SQL_HOST && (process.env.SQL_HOST.includes('render.com') || process.env.NODE_ENV === 'production')
      ? { rejectUnauthorized: false }
      : false,
    connectionTimeoutMillis: 15000,
  });
};

// Crear una instancia de pool de conexiones.
const pool = createPool();

// Evitar que errores no controlados a nivel de pool tumben la aplicación
pool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

// Inicializar Drizzle con el pool de conexiones y el esquema
export const db = drizzle(pool, { schema });
export { pool, schema };

