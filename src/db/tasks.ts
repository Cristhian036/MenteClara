import { db } from './index.ts';
import { tasks, focusSessions } from './schema.ts';
import { eq, and } from 'drizzle-orm';

// Obtiene todas las tareas para un ID de usuario específico de la base de datos
export async function getTasksForUser(userId: number) {
  try {
    const result = await db.select()
      .from(tasks)
      .where(eq(tasks.userId, userId));
    return result;
  } catch (error) {
    console.error('Error fetching tasks from DB:', error);
    throw new Error('No se pudieron recuperar las tareas de la base de datos.', { cause: error });
  }
}

// Crea una nueva tarea para un usuario
export async function createTaskInDB(userId: number, taskData: {
  id: string;
  title: string;
  category: string;
  stressLevel: string;
  stressScore: number;
  stressLabel: string;
  estimatedMinutes: number;
  dueDate?: string;
  status: string;
  createdAt: string;
  aiSuggestions?: any;
}) {
  try {
    const result = await db.insert(tasks)
      .values({
        id: taskData.id,
        userId: userId,
        title: taskData.title,
        category: taskData.category,
        stressLevel: taskData.stressLevel,
        stressScore: taskData.stressScore,
        stressLabel: taskData.stressLabel,
        estimatedMinutes: taskData.estimatedMinutes,
        dueDate: taskData.dueDate || null,
        status: taskData.status,
        createdAt: taskData.createdAt,
        aiSuggestions: taskData.aiSuggestions || null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating task in DB:', error);
    throw new Error('No se pudo guardar la tarea en la base de datos.', { cause: error });
  }
}

// Actualiza el estado de una tarea
export async function updateTaskStatusInDB(userId: number, taskId: string, status: string) {
  try {
    const result = await db.update(tasks)
      .set({ status })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating task status in DB:', error);
    throw new Error('No se pudo actualizar el estado de la tarea en la base de datos.', { cause: error });
  }
}

// Actualiza las sugerencias de IA de una tarea
export async function updateTaskSuggestionsInDB(userId: number, taskId: string, suggestions: any) {
  try {
    const result = await db.update(tasks)
      .set({ aiSuggestions: suggestions })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error updating task suggestions in DB:', error);
    throw new Error('No se pudieron guardar las sugerencias de la IA en la base de datos.', { cause: error });
  }
}

// Elimina una tarea
export async function deleteTaskFromDB(userId: number, taskId: string) {
  try {
    const result = await db.delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error deleting task from DB:', error);
    throw new Error('No se pudo eliminar la tarea de la base de datos.', { cause: error });
  }
}

// Obtiene todas las sesiones de enfoque para un usuario
export async function getFocusSessionsForUser(userId: number) {
  try {
    const result = await db.select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId));
    return result;
  } catch (error) {
    console.error('Error fetching focus sessions from DB:', error);
    throw new Error('No se pudieron recuperar las sesiones de enfoque de la base de datos.', { cause: error });
  }
}

// Crea una nueva sesión de enfoque para un usuario
export async function createFocusSessionInDB(userId: number, sessionData: {
  taskId: string;
  taskTitle: string;
  stressLevel: string;
  minutesFocused: number;
  timestamp: string;
  statusFinished: string;
}) {
  try {
    const result = await db.insert(focusSessions)
      .values({
        userId: userId,
        taskId: sessionData.taskId,
        taskTitle: sessionData.taskTitle,
        stressLevel: sessionData.stressLevel,
        minutesFocused: sessionData.minutesFocused,
        timestamp: sessionData.timestamp,
        statusFinished: sessionData.statusFinished,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error creating focus session in DB:', error);
    throw new Error('No se pudo registrar la sesión de enfoque en la base de datos.', { cause: error });
  }
}
