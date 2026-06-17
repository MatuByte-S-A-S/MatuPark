# MatuPark

Sistema SaaS para administración de parqueaderos. Stack: **Vue 3**, **TypeScript**, **Vite**, **TailwindCSS**, **Pinia**, **Vue Router**, **MatuDB**.

## Requisitos

- Node.js 18+
- Instancia [MatuDB](https://devjuanes.com) en ejecución

## Instalación

```bash
npm install
cp .env.example .env
# Editar .env con URL, projectId y apiKey de MatuDB
```

## Base de datos

Ejecutar en PostgreSQL (MatuDB):

1. `database/schema.sql` — tablas (instalación nueva)
2. `database/seed.sql` — parqueadero demo (opcional)

**Si la caja muestra "Table does not exist"** (BD creada antes del módulo caja):

- Opción A: en el panel MatuDB → SQL, ejecuta `database/migrations/FIX_caja.sql`
- Opción B: en la terminal del proyecto: `npm run migrate`

Luego habilita **realtime** en: `cash_sessions`, `cash_movements`

**Registro desde la app:** abre `/register` — crea cuenta MatuDB, parqueadero, configuración y perfil admin automáticamente.

Alternativa manual: crear usuario en **MatuDB Auth** e insertar perfil en `users` (ver `database/seed.sql`).

## Desarrollo

```bash
npm run dev
```

App: `http://localhost:5173`

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/login` | Iniciar sesión |
| `/register` | Crear cuenta (parqueadero + admin) |
| `/dashboard` | KPIs y gráficos (realtime) |
| `/ingreso` | Registro + ticket QR |
| `/salida` | Cobro y finalización |
| `/aforo` | Cupos en tiempo real |
| `/configuracion` | Admin: parqueadero y tarifas |
| `/usuarios` | Admin: gestión usuarios |
| `/reportes` | PDF / Excel |
| `/ticket/:codigo` | Consulta pública (sin auth) |
| `/parking/:slug` | Landing pública |

## Roles

- **admin**: configuración, usuarios, reportes, tarifas
- **operator**: ingreso, salida, cobro, aforo

## Tarifas

- Modo `full_hour`: horas completas (ej. 2h 10m = 3 h)
- Modo `proportional`: fracción decimal de hora
- Tolerancia en minutos: si tiempo ≤ tolerancia → $0

## Premium (preparado)

Vista `/premium`: reconocimiento de placas, multi-sucursal, multi-parqueadero.

## Build

```bash
npm run build
```
