import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

if (!databaseUrl && (!sqlHost || !sqlDbName || !user || !password)) {
  throw new Error('Debe proporcionar DATABASE_URL o las variables individuales (SQL_HOST, SQL_DB_NAME, SQL_ADMIN_USER/SQL_USER, SQL_ADMIN_PASSWORD/SQL_PASSWORD) en las variables de entorno.');
}

const dbCredentials = databaseUrl
  ? { url: databaseUrl, ssl: { rejectUnauthorized: false } }
  : {
      host: sqlHost || '',
      user: user || '',
      password: password || '',
      database: sqlDbName || '',
      ssl: sqlHost && (sqlHost.includes('render.com') || process.env.NODE_ENV === 'production')
        ? { rejectUnauthorized: false }
        : false,
    };

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle', // Directorio de salida para las migraciones.
  dialect: 'postgresql',
  schemaFilter: ['public'],
  tablesFilter: ['users', 'tasks', 'focus_sessions'],
  dbCredentials,
  verbose: true, // Habilitar salida detallada.
});
