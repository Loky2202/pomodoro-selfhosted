import { Router } from 'express'
import { db } from '../db.js'
import {
  clampInt,
  cleanText,
  isDay,
  localDay,
  parseId,
  sessionJson,
} from '../utils.js'

const router = Router()

const MODES = new Set(['focus', 'short', 'long', 'stopwatch'])
const STATUSES = new Set(['completed', 'cancelled'])

router.get('/', (req, res) => {
  const profileId = parseId(req.query.profileId)
  if (!profileId) return res.status(400).json({ error: 'profileId es obligatorio' })

  const limit = clampInt(req.query.limit, 1, 1000, 50)
  const offset = clampInt(req.query.offset, 0, 100000, 0)

  const total = db
    .prepare('SELECT COUNT(*) AS total FROM sessions WHERE profile_id = ?')
    .get(profileId).total

  const rows = db
    .prepare(
      `SELECT * FROM sessions
       WHERE profile_id = ?
       ORDER BY started_at DESC, id DESC
       LIMIT ? OFFSET ?`
    )
    .all(profileId, limit, offset)

  res.json({ total, sessions: rows.map(sessionJson) })
})

router.post('/', (req, res) => {
  const profileId = parseId(req.body?.profileId)
  if (!profileId) return res.status(400).json({ error: 'Perfil inválido' })

  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId)
  if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' })

  const mode = req.body?.mode
  if (!MODES.has(mode)) return res.status(400).json({ error: 'Modo inválido' })

  const status = req.body?.status
  if (!STATUSES.has(status)) return res.status(400).json({ error: 'Estado inválido' })

  const presetId = parseId(req.body?.presetId)
  const preset = presetId
    ? db
        .prepare('SELECT id FROM presets WHERE id = ? AND profile_id = ?')
        .get(presetId, profileId)
    : null

  const now = new Date()
  const startedDate = parseDate(req.body?.startedAt) || now
  const endedDate = parseDate(req.body?.endedAt) || now
  const plannedSeconds = clampInt(req.body?.plannedSeconds, 0, 86400, 0)
  const actualSeconds = clampInt(req.body?.actualSeconds, 0, 86400, 0)
  const day = isDay(req.body?.day) ? req.body.day : localDay(startedDate)
  const hour = clampInt(req.body?.hour, 0, 23, startedDate.getHours())

  const result = db
    .prepare(
      `INSERT INTO sessions
        (profile_id, preset_id, label, mode, planned_seconds, actual_seconds,
         status, started_at, ended_at, day, hour)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      profileId,
      preset?.id ?? null,
      cleanText(req.body?.label, 80),
      mode,
      plannedSeconds,
      actualSeconds,
      status,
      startedDate.toISOString(),
      endedDate.toISOString(),
      day,
      hour
    )

  const row = db
    .prepare('SELECT * FROM sessions WHERE id = ?')
    .get(Number(result.lastInsertRowid))
  res.status(201).json(sessionJson(row))
})

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Sesión inválida' })

  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Sesión no encontrada' })
  }
  res.status(204).end()
})

function parseDate(value) {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export default router
