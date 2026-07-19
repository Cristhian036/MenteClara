// Script para verificar/inicializar PostgreSQL y arrancar el backend y frontend en paralelo
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

dotenv.config();

const { Client, Pool } = pg;

const dbHost = process.env.SQL_HOST || 'localhost';
const dbPort = parseInt(process.env.SQL_PORT || '5432', 10);
const dbUser = process.env.SQL_USER || 'postgres';
const dbPassword = process.env.SQL_PASSWORD || 'root';
const dbName = process.env.SQL_DB_NAME || 'mentesana';

async function checkAndCreateDatabase() {
  // Conectarse primero a la base de datos de mantenimiento por defecto ('postgres')
  const maintenanceClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    console.log(`Conectando al servidor PostgreSQL en ${dbHost}:${dbPort} para verificar la base de datos...`);
    await maintenanceClient.connect();

    // Consultar si la base de datos destino ya existe
    const res = await maintenanceClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (res.rowCount === 0) {
      console.log(`La base de datos "${dbName}" no existe. Creándola...`);
      // Crear la base de datos (PostgreSQL no permite crear BDs en transacciones, se ejecuta directo)
      await maintenanceClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`¡Base de datos "${dbName}" creada exitosamente!`);
      return false; // Indica que se acaba de crear de cero
    } else {
      console.log(`La base de datos "${dbName}" ya existe.`);
      return true; // Ya existía
    }
  } catch (error) {
    console.error('Error al conectar o crear la base de datos:', error.message);
    throw error;
  } finally {
    await maintenanceClient.end();
  }
}

async function runTableMigration() {
  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ssl: false,
  });

  console.log(`Conectando a la base de datos "${dbName}" para verificar tablas...`);
  const client = await pool.connect();
  try {
    // Comprobar si la tabla 'users' ya existe para evitar ejecutar el SQL otra vez
    const checkTablesQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    const checkRes = await client.query(checkTablesQuery);
    const tablesExist = checkRes.rows[0].exists;

    if (!tablesExist) {
      const sqlPath = path.join(process.cwd(), 'init.sql');
      console.log(`Leyendo consultas SQL desde: ${sqlPath}`);
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');

      console.log('Creando tablas e índices...');
      await client.query(sqlContent);
      console.log('¡Tablas y relaciones creadas exitosamente!');
    } else {
      console.log('Las tablas ya están creadas. Omitiendo paso de migración.');
    }
  } catch (error) {
    console.error('Error al inicializar las tablas de la base de datos:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedDefaultData() {
  const pool = new Pool({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ssl: false,
  });

  const client = await pool.connect();
  try {
    console.log('Verificando datos semilla (Usuario: user@gmail.com)...');
    
    // Verificar si el usuario semilla ya existe
    const userCheck = await client.query('SELECT id FROM users WHERE email = $1', ['user@gmail.com']);
    
    if (userCheck.rowCount === 0) {
      console.log('Insertando usuario semilla (user@gmail.com)...');
      
      // 1. Insertar el usuario
      const userInsertRes = await client.query(`
        INSERT INTO users (uid, email, password, display_name) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id
      `, ['usr_seed_user', 'user@gmail.com', 'user', 'user']);
      
      const seedUserId = userInsertRes.rows[0].id;
      
      // 2. Insertar tareas (pendientes y completadas)
      console.log('Insertando tareas por hacer e historial para el usuario...');
      
      // Tarea Pendiente 1
      await client.query(`
        INSERT INTO tasks (id, user_id, title, category, stress_level, stress_score, stress_label, estimated_minutes, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, ['task-seed-1', seedUserId, 'Preparar exposición de Ingeniería de Software', 'Universidad', 'high', 5, 'Muy Alto', 45, 'pending', new Date().toISOString()]);
      
      // Tarea Pendiente 2
      await client.query(`
        INSERT INTO tasks (id, user_id, title, category, stress_level, stress_score, stress_label, estimated_minutes, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, ['task-seed-2', seedUserId, 'Completar práctica de Base de Datos', 'Estudio', 'medium', 3, 'Moderado', 30, 'pending', new Date().toISOString()]);
      
      // Tarea Completada (aparecerá en el historial de sesiones)
      await client.query(`
        INSERT INTO tasks (id, user_id, title, category, stress_level, stress_score, stress_label, estimated_minutes, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, ['task-seed-3', seedUserId, 'Repasar teoría de límites y derivadas', 'Matemáticas', 'medium', 3, 'Moderado', 25, 'completed', new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()]);

      // 3. Insertar sesiones de enfoque (historial de ejecución)
      console.log('Insertando historial de sesiones de enfoque...');
      
      // Sesión de Enfoque 1 (Tarea completada task-seed-3)
      await client.query(`
        INSERT INTO focus_sessions (user_id, task_id, task_title, stress_level, minutes_focused, timestamp, status_finished)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [seedUserId, 'task-seed-3', 'Repasar teoría de límites y derivadas', 'medium', 25, new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 'completed']);
      
      // Sesión de Enfoque 2 (Sesión interrumpida de ejemplo)
      await client.query(`
        INSERT INTO focus_sessions (user_id, task_id, task_title, stress_level, minutes_focused, timestamp, status_finished)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [seedUserId, 'task-seed-other', 'Lectura de IHC: Diseño centrado en el usuario', 'low', 15, new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), 'interrupted']);

      console.log('¡Datos semilla insertados exitosamente!');
    } else {
      console.log('El usuario semilla "user@gmail.com" ya existe en la base de datos.');
    }
  } catch (error) {
    console.error('Error al insertar datos semilla:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

function startApplications() {
  console.log('\n======================================================');
  console.log('Iniciando Servidores de Backend y Frontend...');
  console.log('======================================================\n');

  // Arrancar el backend (puerto 3000)
  console.log('[Sistema] Iniciando Backend en puerto 3000...');
  const backend = spawn('npm', ['run', 'dev:backend'], { stdio: 'pipe', shell: true });

  // Arrancar el frontend (puerto 5173)
  console.log('[Sistema] Iniciando Frontend en puerto 5173...');
  const frontend = spawn('npm', ['run', 'dev:frontend'], { stdio: 'pipe', shell: true });

  let backendFailed = false;
  let frontendFailed = false;

  // Interceptar logs de Backend
  backend.stdout.on('data', (data) => {
    process.stdout.write(`[Backend] ${data}`);
  });

  backend.stderr.on('data', (data) => {
    const errorMsg = data.toString();
    if (errorMsg.includes('EADDRINUSE') || errorMsg.includes('address already in use')) {
      if (!backendFailed) {
        backendFailed = true;
        console.error('\n[Error de Puerto - Backend]: El puerto 3000 ya está siendo usado por otro proceso.');
        console.error('Solución: Cierra las terminales de backend activas o ejecuta en PowerShell:');
        console.error('   Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess -Force\n');
      }
    } else {
      // Filtrar el volcado de pila de eventos de Node si ya sabemos que fue por puerto en uso
      if (!backendFailed || (!errorMsg.includes('node:events') && !errorMsg.includes('setupListenHandle') && !errorMsg.includes('listenInCluster'))) {
        process.stderr.write(`[Backend Error] ${data}`);
      }
    }
  });

  // Interceptar logs de Frontend
  frontend.stdout.on('data', (data) => {
    process.stdout.write(`[Frontend] ${data}`);
  });

  frontend.stderr.on('data', (data) => {
    const errorMsg = data.toString();
    if (errorMsg.includes('EADDRINUSE') || errorMsg.includes('address already in use')) {
      if (!frontendFailed) {
        frontendFailed = true;
        console.error('\n[Error de Puerto - Frontend]: El puerto 5173 ya está siendo usado por otro proceso.');
        console.error('Solución: Cierra las terminales de frontend activas o ejecuta en PowerShell:');
        console.error('   Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force\n');
      }
    } else {
      if (!frontendFailed || (!errorMsg.includes('node:events') && !errorMsg.includes('setupListenHandle') && !errorMsg.includes('listenInCluster'))) {
        process.stderr.write(`[Frontend Error] ${data}`);
      }
    }
  });

  // Capturar la finalización con error de los servidores
  backend.on('exit', (code) => {
    if (code !== 0 && code !== null && !backendFailed) {
      console.error(`\n[Backend] El servidor se detuvo con código de error ${code}.`);
    }
  });

  frontend.on('exit', (code) => {
    if (code !== 0 && code !== null && !frontendFailed) {
      console.error(`\n[Frontend] El servidor se detuvo con código de error ${code}.`);
    }
  });

  // Limpiar procesos secundarios al cerrar la terminal
  const cleanExit = () => {
    console.log('\n[Sistema] Deteniendo servidores de desarrollo...');
    backend.kill();
    frontend.kill();
    process.exit();
  };

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
}

async function main() {
  try {
    const dbExisted = await checkAndCreateDatabase();
    await runTableMigration();
    await seedDefaultData();

    // Si ya existía o se acaba de crear, el flujo continúa aquí y arranca la app
    startApplications();
  } catch (error) {
    console.error('\nNo se pudo completar la inicialización de la base de datos.');
    console.error('Revisa que las credenciales de tu archivo .env sean correctas.');
    process.exit(1);
  }
}

main();
