import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { generateStartSuggestions } from './services/geminiService.js';
import { requireAuth, AuthRequest } from '../src/middleware/auth.ts';
import { getOrCreateUser, registerLocalUser, loginLocalUser, updateUserProfileInDB } from '../src/db/users.ts';
import {
  getTasksForUser,
  createTaskInDB,
  updateTaskStatusInDB,
  updateTaskSuggestionsInDB,
  deleteTaskFromDB,
  getFocusSessionsForUser,
  createFocusSessionInDB
} from '../src/db/tasks.ts';

import { pool } from '../src/db/index.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // Registrar todas las peticiones y respuestas de la API
  app.use('/api', (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const maskedAuth = authHeader 
      ? (authHeader.startsWith('Bearer ') 
          ? `Bearer ${authHeader.slice(7, 17)}... (length: ${authHeader.length - 7})` 
          : `Invalid format: ${authHeader.slice(0, 10)}...`)
      : 'None';

    console.log(`[API REQUEST] ${req.method} ${req.originalUrl} - Auth Header: ${maskedAuth}`);

    const originalJson = res.json;
    res.json = function (body) {
      console.log(`[API RESPONSE] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Body:`, JSON.stringify(body));
      return originalJson.apply(this, arguments as any);
    };

    const originalSend = res.send;
    res.send = function (body) {
      console.log(`[API RESPONSE] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Body (type ${typeof body}):`, typeof body === 'string' ? body.slice(0, 300) : '[Non-string]');
      return originalSend.apply(this, arguments as any);
    };

    next();
  });

  // Health check endpoint para Render y clientes móviles
  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (err: any) {
      res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
    }
  });

  // Endpoint público de registro local

  app.post('/api/auth/register-local', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }

      const dbUser = await registerLocalUser(email, password, name);
      res.json(dbUser);
    } catch (error: any) {
      console.error('Error in register-local endpoint:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Endpoint público de inicio de sesión local
  app.post('/api/auth/login-local', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
      }

      const dbUser = await loginLocalUser(email, password);
      res.json(dbUser);
    } catch (error: any) {
      console.error('Error in login-local endpoint:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Endpoint público de actualización de perfil
  app.put('/api/auth/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid } = req.user!;
      const { displayName } = req.body;
      if (!uid) {
        return res.status(400).json({ error: 'Datos de sesión insuficientes.' });
      }
      if (!displayName || !displayName.trim()) {
        return res.status(400).json({ error: 'El nombre es requerido.' });
      }

      const updatedUser = await updateUserProfileInDB(uid, displayName.trim());
      res.json(updatedUser);
    } catch (error: any) {
      console.error('Error in profile update endpoint:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 1. Endpoint de Autenticación - Registra o recupera al usuario autenticado
  app.post('/api/auth/register', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      if (!uid || !email) {
        return res.status(400).json({ error: 'Datos de sesión insuficientes.' });
      }

      const dbUser = await getOrCreateUser(uid, email);
      res.json(dbUser);
    } catch (error: any) {
      console.error('Error registering/retrieving user:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Obtener tareas para el usuario autenticado
  app.get('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const dbUser = await getOrCreateUser(uid, email || '');
      const tasks = await getTasksForUser(dbUser.id);
      res.json(tasks);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Crear una nueva tarea
  app.post('/api/tasks', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const dbUser = await getOrCreateUser(uid, email || '');
      const taskData = req.body;

      if (!taskData.id || !taskData.title) {
        return res.status(400).json({ error: 'Faltan campos requeridos para la tarea.' });
      }

      const newTask = await createTaskInDB(dbUser.id, taskData);
      res.json(newTask);
    } catch (error: any) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Actualizar el estado de una tarea
  app.put('/api/tasks/:id/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const dbUser = await getOrCreateUser(uid, email || '');
      const taskId = req.params.id;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'El estado es requerido.' });
      }

      const updatedTask = await updateTaskStatusInDB(dbUser.id, taskId, status);
      if (!updatedTask) {
        return res.status(404).json({ error: 'Tarea no encontrada o no autorizada.' });
      }

      res.json(updatedTask);
    } catch (error: any) {
      console.error('Error updating task status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Eliminar una tarea
  app.delete('/api/tasks/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const dbUser = await getOrCreateUser(uid, email || '');
      const taskId = req.params.id;

      const deletedTask = await deleteTaskFromDB(dbUser.id, taskId);
      if (!deletedTask) {
        return res.status(404).json({ error: 'Tarea no encontrada o no autorizada.' });
      }

      res.json({ success: true, message: 'Tarea eliminada correctamente.' });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Obtener las sesiones de enfoque del usuario
  app.get('/api/sessions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const dbUser = await getOrCreateUser(uid, email || '');
      const sessions = await getFocusSessionsForUser(dbUser.id);
      res.json(sessions);
    } catch (error: any) {
      console.error('Error fetching focus sessions:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Registrar una nueva sesión de enfoque
  app.post('/api/sessions', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const dbUser = await getOrCreateUser(uid, email || '');
      const sessionData = req.body;

      if (!sessionData.taskId || !sessionData.taskTitle || !sessionData.statusFinished) {
        return res.status(400).json({ error: 'Faltan campos requeridos para la sesión.' });
      }

      const newSession = await createFocusSessionInDB(dbUser.id, sessionData);
      res.json(newSession);
    } catch (error: any) {
      console.error('Error recording focus session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Endpoint de la API para sugerencias de IA, llamando a la capa de servicios e indexando en base de datos
  app.post('/api/suggest-start', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user!;
      const dbUser = await getOrCreateUser(uid, email || '');
      const { title, category, stressLevel, stressLabel, dueDate, taskId } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'El título del pendiente es requerido.' });
      }

      // Generar sugerencias usando Gemini
      const suggestions = await generateStartSuggestions({
        title,
        category,
        stressLevel,
        stressLabel,
        dueDate
      });

      // Si se proporciona un taskId, actualizar la tarea en la base de datos con las sugerencias
      if (taskId) {
        await updateTaskSuggestionsInDB(dbUser.id, taskId, suggestions);
      }

      res.json(suggestions);
    } catch (error: any) {
      console.error('Error generating suggestions with Gemini Service:', error);
      res.status(500).json({
        error: 'No pudimos consultar al asesor de paz en este momento.',
        details: error.message,
        introduction: "Parece que la conexión de paz está saturada, pero el consejo más valioso sigue en pie:",
        steps: [
          "Pon un cronómetro de 2 minutos.",
          "Escribe garabatos flojos y sin estructura.",
          "Felicítate solo por sentarte hoy."
        ],
        mantra: "La acción precede a la motivación.",
        studyResources: [
          {
            type: "Búsqueda instructiva",
            title: "Técnica Pomodoro de Alivio",
            urlOrQuery: "procrastinar pomodoro de micro pasos",
            whyHelpful: "Para desactivar temporalmente el rechazo de tu cerebro a empezar."
          }
        ]
      });
    }
  });

  // Middleware de Vite para desarrollo
  if (process.env.NODE_ENV !== "production" && process.env.SKIP_VITE_MIDDLEWARE !== "true") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
