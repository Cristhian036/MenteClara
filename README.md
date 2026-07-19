<div align="center">
<img height="100%" alt="GHBanner" src="https://i.ibb.co/84SqQ6jy/f430b2c0-1c8b-44e7-a266-70631bfb52eb.jpg" />
</div>

# Mente Clara

Este repositorio contiene todo lo necesario para ejecutar la aplicación de control de estrés y productividad **Mente Clara** de manera local, utilizando una base de datos **PostgreSQL** y corriendo el backend (API Express) y el frontend (Vite React) de forma independiente.

---

## 🛠️ Requisitos Previos

Asegúrate de tener instalados en tu computadora:
1. **Node.js** (versión v20 o superior recomendada).
2. **PostgreSQL** ejecutándose localmente (por ejemplo, mediante pgAdmin 4).

---

## 🚀 Guía de Configuración y Ejecución Paso a Paso

### Paso 1: Configurar el Archivo de Entorno (`.env`)
Crea un archivo llamado `.env` en la raíz del proyecto (puedes duplicar `.env.example` y renombrarlo) con los siguientes parámetros:

```env
# Gemini API Key (Requerido para el Asesor de Paz)
GEMINI_API_KEY="TU_GEMINI_API_KEY_AQUÍ"

# Conexión local a tu PostgreSQL
SQL_HOST="localhost"
SQL_USER="postgres"
SQL_PASSWORD="tu_contraseña_de_postgres" # Reemplaza por tu contraseña (ej: "root")
SQL_DB_NAME="mentesana"                   # Asegúrate de que esta base de datos exista

# Configuración de ejecución separada
SKIP_VITE_MIDDLEWARE="true"
VITE_API_URL="http://localhost:3000"
```

---

### Paso 2: Ejecutar la aplicación en modo desarrollo
Para verificar/crear la base de datos local de PostgreSQL, generar las tablas de forma automática e iniciar tanto el backend (puerto 3000) como el frontend (puerto 5173) en paralelo, solo tienes que ejecutar:

```bash
npm run dev
```

*Este script se encargará de validar todo y dejar la aplicación ejecutándose de inmediato.*

---

## 📂 Estructura Principal del Proyecto

*   **`server/server.ts`**: Código fuente del servidor backend Express con endpoints de la API.
*   **`src/`**: Aplicación frontend construida en React + TypeScript y Tailwind CSS.
*   **`src/db/`**: Definición de esquemas de Drizzle ORM y configuraciones de bases de datos.
*   **`init.sql`**: Script en SQL para inicializar de forma manual las tablas si es necesario.
*   **`start-dev.js`**: Script de Node que verifica la base de datos, crea tablas e inicia el desarrollo en paralelo.

---

## 💡 Comandos Disponibles en `package.json`

*   `npm run dev`: Inicializa la base de datos (si no existe), aplica migraciones (si faltan tablas) y arranca backend y frontend en paralelo.
*   `npm run dev:backend`: Ejecuta el servidor API Express de manera aislada (puerto 3000).
*   `npm run dev:frontend`: Ejecuta el servidor de desarrollo de frontend Vite (puerto 5173).
*   `npm run db:push`: Empuja directamente el esquema Drizzle a la base de datos.
*   `npm run build`: Compila los archivos del frontend y empaqueta el backend en la carpeta `/dist`.
*   `npm run lint`: Ejecuta el type-checker TypeScript (`tsc --noEmit`) para verificar errores de compilación.
