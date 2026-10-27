import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { closeDatabase, DB_PATH } from './db.js'
import profilesRouter from './routes/profiles.js'
import presetsRouter from './routes/presets.js'
import sessionsRouter from './routes/sessions.js'
import statsRouter from './routes/stats.js'
import tasksRouter from './routes/tasks.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = Number(process.env.PORT) || 3000

app.disable('x-powered-by')
app.use(express.json({ limit: '64kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', database: DB_PATH, uptime: Math.round(process.uptime()) })
})

app.use('/api/profiles', profilesRouter)
app.use('/api', presetsRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/stats', statsRouter)
app.use('/api', tasksRouter)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

const publicDir = [
  process.env.PUBLIC_DIR,
  path.join(__dirname, '..', '..', 'public'),
  path.join(__dirname, '..', '..', 'frontend', 'dist'),
]
  .filter(Boolean)
  .find((candidate) => fs.existsSync(path.join(candidate, 'index.html')))

if (publicDir) {
  app.use(express.static(publicDir, { index: false, maxAge: '1h' }))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    return res.sendFile(path.join(publicDir, 'index.html'))
  })
} else {
  console.warn(
    'No se encontró la build del frontend. En desarrollo usa Vite en http://localhost:5173'
  )
}

app.use((err, _req, res, _next) => {
  console.error(err)
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' })
  }
  return res.status(500).json({ error: 'Error interno del servidor' })
})

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Pomodoro escuchando en http://0.0.0.0:${PORT}`)
  console.log(`Base de datos: ${DB_PATH}`)
  if (publicDir) console.log(`Frontend: ${publicDir}`)
})

function shutdown(signal) {
  console.log(`\n${signal} recibido, cerrando...`)
  server.close(() => {
    closeDatabase()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
