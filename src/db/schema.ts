import { pgTable, serial, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Definir la tabla 'users'
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // ID de inicio de sesión único
  email: text('email').notNull(),
  password: text('password'), // Nulo para el inicio de sesión con Google
  displayName: text('display_name'), // Nulo para el registro local
  createdAt: timestamp('created_at').defaultNow(),
});

// Definir la tabla 'tasks'
export const tasks = pgTable('tasks', {
  id: text('id').primaryKey(), // ID único de cadena de texto generado por el cliente o servidor
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  stressLevel: text('stress_level').notNull(), // 'high' | 'medium' | 'low'
  stressScore: integer('stress_score').notNull(), // Rango de 1 a 5
  stressLabel: text('stress_label').notNull(),
  estimatedMinutes: integer('estimated_minutes').notNull(),
  dueDate: text('due_date'), // Formato 'YYYY-MM-DD'
  status: text('status').notNull().default('pending'), // 'pending' | 'completed'
  createdAt: text('created_at').notNull(),
  aiSuggestions: jsonb('ai_suggestions'), // Almacena el JSON procesado de las sugerencias de la IA
});

// Definir la tabla 'focus_sessions'
export const focusSessions = pgTable('focus_sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  taskId: text('task_id').notNull(),
  taskTitle: text('task_title').notNull(),
  stressLevel: text('stress_level').notNull(), // 'high' | 'medium' | 'low'
  minutesFocused: integer('minutes_focused').notNull(),
  timestamp: text('timestamp').notNull(),
  statusFinished: text('status_finished').notNull(), // 'completed' | 'timeout' | 'interrupted'
});

// Definir relaciones para la tabla 'users'
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  focusSessions: many(focusSessions),
}));

// Definir relaciones para la tabla 'tasks'
export const tasksRelations = relations(tasks, ({ one }) => ({
  author: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

// Definir relaciones para la tabla 'focusSessions'
export const focusSessionsRelations = relations(focusSessions, ({ one }) => ({
  author: one(users, {
    fields: [focusSessions.userId],
    references: [users.id],
  }),
}));
