# Focus · Pomodoro Self-Hosted

Pomodoro local para toda tu red. Temporizador, perfiles independientes, seguimiento de sesiones,
resúmenes, gráficas y perfiles de sesión personalizados. Todo en **un único contenedor Docker** y
con **SQLite** como base de datos.

## Funciones

- **Temporizador** con enfoque, descanso corto y descanso largo, inicio automático opcional,
  sonido y atajos de teclado.
- **Perfiles** separados (trabajo, estudio, personal…) con su propio color, tiempos e historial.
- **Perfiles de sesión**: combinaciones de tiempos listas para usar (por ejemplo 50/10 o 25/5).
- **Etiquetas por sesión** para saber en qué invertiste el tiempo.
- **Lista de tareas** por perfil: crea, edita, elimina y completa actividades, y elige una tarea al iniciar una sesión de enfoque.
- **Resumen** con tiempo de hoy, últimos 7 días, racha, media diaria, gráfica por día,
  distribución por etiqueta, mapa de calor de 90 días y horas más activas.
- **Historial** de sesiones, borrado individual y exportación a **CSV**.
- **Persistencia en SQLite** dentro de la carpeta `./data` del host.
- **Red local**: accesible desde móvil, tablet u otros ordenadores con la IP del servidor.

## Inicio rápido con Docker

Requisitos: Docker Desktop (Windows/macOS) o Docker Engine con Compose (Linux).

```bash
docker compose up -d --build
```

Abre <http://localhost:3000>. La primera vez se crea un perfil llamado **Personal** con tres
perfiles de sesión de ejemplo.

Para copiar la configuración de ejemplo:

```bash
copy .env.example .env      # Windows
cp .env.example .env        # Linux / macOS
```

Puedes cambiar el puerto y la zona horaria en `.env`.

### Acceso desde otros dispositivos de la red

1. Averigua la IP local del equipo que ejecuta Docker:

   ```powershell
   ipconfig
   ```

   Busca la dirección IPv4 de tu adaptador Wi-Fi/Ethernet (por ejemplo `192.168.1.40`).

2. Desde el móvil u otro equipo abre:

   ```text
   http://192.168.1.40:3000
   ```

3. Si no carga, permite el puerto en el firewall de Windows (PowerShell como administrador):

   ```powershell
   New-NetFirewallRule -DisplayName "Pomodoro 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```

> Todos los dispositivos deben estar en la misma red. Las estadísticas y sesiones son
> compartidas; el estado del temporizador en curso se guarda por dispositivo en el navegador.

> **Seguridad:** la aplicación no tiene inicio de sesión ni control de acceso. Cualquier persona
> con acceso al puerto puede ver y modificar perfiles e historial. Úsala solo en una red local de
> confianza y no la expongas directamente a Internet.

## Datos y copias de seguridad

La base de datos vive en `./data/pomodoro.db` (con sus archivos `-wal` y `-shm`). Esa carpeta está
montada como volumen, así que reconstruir el contenedor no borra nada.

Para una copia de seguridad consistente, detén el contenedor y copia la carpeta:

```bash
docker compose stop
# copia ./data a otro lugar
docker compose start
```

Para empezar de cero: `docker compose down` y elimina `./data` (se volverá a crear sola).

## Desarrollo local

Requisitos: Node.js 24 o superior (usa el módulo nativo `node:sqlite`).

```bash
npm run setup
```

En dos terminales:

```bash
npm run dev:server   # API en http://localhost:3000
npm run dev:web      # Vite en http://localhost:5173 (proxy /api)
```

Abre <http://localhost:5173>. Para probar el modo producción sirviendo la build desde Express:

```bash
npm run build
npm start
```

## Estructura

```text
.
├── backend/               # Express + SQLite (node:sqlite)
│   └── src/
│       ├── server.js      # API, estáticos y arranque
│       ├── db.js          # Esquema, migraciones y seed
│       └── routes/        # profiles, presets, sessions, stats
├── frontend/              # React + Vite
│   └── src/
│       ├── pages/         # Timer, Dashboard, Profiles
│       ├── components/    # Layout, formularios, gráficas, iconos
│       └── styles.css
├── data/                  # Base de datos SQLite (no se versiona)
├── Dockerfile             # Build multi-etapa en un solo contenedor
└── docker-compose.yml
```

## API

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/health` | Estado del servicio |
| GET/POST | `/api/profiles` | Listar / crear perfiles |
| PUT/DELETE | `/api/profiles/:id` | Editar / eliminar perfil |
| GET | `/api/profiles/:id/presets` | Perfiles de sesión del perfil |
| POST/PUT/DELETE | `/api/presets…` | Gestionar perfiles de sesión |
| GET | `/api/profiles/:id/tasks` | Tareas del perfil |
| POST/PUT/DELETE | `/api/tasks…` | Gestionar tareas |
| GET/POST | `/api/sessions` | Historial / registrar sesión |
| DELETE | `/api/sessions/:id` | Eliminar una sesión |
| GET | `/api/stats?profileId=1&days=90&today=YYYY-MM-DD` | Totales, series y agregados |

## Notas

- Las notificaciones del navegador suelen requerir HTTPS fuera de `localhost`; en red local el
  sonido y la propia app siguen funcionando con normalidad.
- El temporizador usa marcas de tiempo reales, así que sigue siendo exacto aunque la pestaña pase
  a segundo plano. La sesión en curso se recupera al recargar.
- Para actualizar tras cambiar el código: `docker compose up -d --build`.
