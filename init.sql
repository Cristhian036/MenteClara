-- Script de creación de tablas para MenteClara en PostgreSQL

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password TEXT,
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Tareas
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    stress_level TEXT NOT NULL,
    stress_score INTEGER NOT NULL,
    stress_label TEXT NOT NULL,
    estimated_minutes INTEGER NOT NULL,
    due_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    ai_suggestions JSONB
);

-- 3. Tabla de Sesiones de Enfoque
CREATE TABLE IF NOT EXISTS focus_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    task_title TEXT NOT NULL,
    stress_level TEXT NOT NULL,
    minutes_focused INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    status_finished TEXT NOT NULL
);

-- Índices recomendados para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
