# ☁️ Guía de Despliegue en Producción — Render.com + PostgreSQL

Este documento explica el flujo paso a paso para desplegar la base de datos PostgreSQL y la API backend Node.js en la nube usando la plataforma **Render.com**.

---

## 📑 Contenido de la Guía

1. [🗄️ Paso 1: Instancia PostgreSQL en Render](#1-instancia-postgresql-en-render)
2. [⚙️ Paso 2: Servidor API (Web Service)](#2-servidor-api-web-service)
3. [🔤 Paso 3: Inicialización del Esquema SQL](#3-inicialización-del-esquema-sql)
4. [🩺 Paso 4: Verificación del Servidor (Health Check)](#4-verificación-del-servidor-health-check)

---

## 1. Instancia PostgreSQL en Render

1. Accede al [Panel de Control de Render](https://dashboard.render.com).
2. Haz clic en **New +** y selecciona **PostgreSQL**.
3. Configura los datos principales de la base de datos:
   - **Name**: `mentesana-db`
   - **Database**: `mentesana`
   - **User**: `postgres`
   - **Region**: Selecciona la región geográfica con menor latencia.
4. Haz clic en **Create Database**.
5. Al finalizar la creación, copia la **Internal Database URL** y la **External Database URL**.

---

## 2. Servidor API (Web Service)

1. En el panel de Render, haz clic en **New +** -> **Web Service**.
2. Conecta tu repositorio de GitHub.
3. Ingresa los comandos de build e inicio:

```text
Name:           mentesana-backend
Environment:    Node
Build Command:  npm install && npm run build
Start Command:  node dist/server.cjs
```

4. En la pestaña **Environment Variables**, registra las siguientes claves:

| Variable | Descripción | Ejemplo de Valor |
| :--- | :--- | :--- |
| `NODE_ENV` | Modo de ejecución de Node | `production` |
| `SKIP_VITE_MIDDLEWARE` | Desactiva Vite para servir únicamente la API | `true` |
| `SQL_HOST` | Host asignado por Render PostgreSQL | `dpg-xxxx.render.com` |
| `SQL_USER` | Usuario asignado en la BD de Render | `postgres` |
| `SQL_PASSWORD` | Contraseña asignada en la BD de Render | `••••••••••••` |
| `SQL_DB_NAME` | Nombre de la base de datos | `mentesana` |
| `GEMINI_API_KEY` | Clave API oficial de Google Gemini AI Studio | `AIzaSy...` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID Web para Google OAuth | `1037...apps.googleusercontent.com` |

5. Haz clic en **Create Web Service**.

---

## 3. Inicialización del Esquema SQL

Si creaste una base de datos nueva, puedes inicializar el esquema completo de tablas ejecutando el script `init.sql`:

```bash
# Conexión remota usando psql con la External Database URL
psql "postgresql://postgres:password@dpg-xxxx.render.com/mentesana" -f init.sql
```

---

## 4. Verificación del Servidor (Health Check)

Una vez completado el despliegue del Web Service en Render, puedes comprobar el estado de salud del servidor y la conectividad a la base de datos accediendo al endpoint de diagnóstico:

```bash
curl https://mentesana-backend.onrender.com/api/health
```

> [!NOTE]
> ### Respuesta Esperada:
> ```json
> {
>   "status": "ok",
>   "db": "connected",
>   "timestamp": "2026-07-19T22:00:00.000Z"
> }
> ```
