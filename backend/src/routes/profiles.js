import { Router } from 'express'
import { db } from '../db.js'
import {
  DEFAULT_COLOR,
  clampInt,
  cleanText,
  isValidColor,
  parseId,
  profileJson,
} from '../utils.js'

const router = Router()

function readProfileInput(body, existing = null) {
  const base = existing
    ? profileJson(existing)
    : {
        name: '',
        color: DEFAULT_COLOR,
        workMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        longBreakInterval: 4,
        autoStartBreaks: true,
        autoStartFocus: false,
        soundEnabled: true,
      }

  return {
    name: cleanText(body?.name, 40) || base.name,
    color: isValidColor(body?.color) ? body.color.toLowerCase() : base.color,
    workMinutes: clampInt(body?.workMinutes, 1, 180, base.workMinutes),
    shortBreakMinutes: clampInt(body?.shortBreakMinutes, 1, 120, base.shortBreakMinutes),
    longBreakMinutes: clampInt(body?.longBreakMinutes, 1, 180, base.longBreakMinutes),
    longBreakInterval: clampInt(body?.longBreakInterval, 2, 12, base.longBreakInterval),
    autoStartBreaks:
      typeof body?.autoStartBreaks === 'boolean' ? body.autoStartBreaks : base.autoStartBreaks,
    autoStartFocus:
      typeof body?.autoStartFocus === 'boolean' ? body.autoStartFocus : base.autoStartFocus,
    soundEnabled:
      typeof body?.soundEnabled === 'boolean' ? body.soundEnabled : base.soundEnabled,
  }
}

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM profiles ORDER BY id ASC').all()
  res.json(rows.map(profileJson))
})

router.post('/', (req, res) => {
  const input = readProfileInput(req.body)
  if (!input.name) {
    return res.status(400).json({ error: 'El nombre del perfil es obligatorio' })
  }

  const result = db
    .prepare(
      `INSERT INTO profiles
        (name, color, work_minutes, short_break_minutes, long_break_minutes,
         long_break_interval, auto_start_breaks, auto_start_focus, sound_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.name,
      input.color,
      input.workMinutes,
      input.shortBreakMinutes,
      input.longBreakMinutes,
      input.longBreakInterval,
      input.autoStartBreaks ? 1 : 0,
      input.autoStartFocus ? 1 : 0,
      input.soundEnabled ? 1 : 0
    )

  const row = db
    .prepare('SELECT * FROM profiles WHERE id = ?')
    .get(Number(result.lastInsertRowid))

  res.status(201).json(profileJson(row))
})

router.put('/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Perfil inválido' })

  const existing = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Perfil no encontrado' })

  const input = readProfileInput(req.body, existing)
  if (!input.name) {
    return res.status(400).json({ error: 'El nombre del perfil es obligatorio' })
  }

  db.prepare(
    `UPDATE profiles SET
       name = ?, color = ?, work_minutes = ?, short_break_minutes = ?,
       long_break_minutes = ?, long_break_interval = ?, auto_start_breaks = ?,
       auto_start_focus = ?, sound_enabled = ?
     WHERE id = ?`
  ).run(
    input.name,
    input.color,
    input.workMinutes,
    input.shortBreakMinutes,
    input.longBreakMinutes,
    input.longBreakInterval,
    input.autoStartBreaks ? 1 : 0,
    input.autoStartFocus ? 1 : 0,
    input.soundEnabled ? 1 : 0,
    id
  )

  const row = db.prepare('SELECT * FROM profiles WHERE id = ?').get(id)
  res.json(profileJson(row))
})

router.delete('/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Perfil inválido' })

  const total = db.prepare('SELECT COUNT(*) AS total FROM profiles').get().total
  if (total <= 1) {
    return res.status(400).json({ error: 'Debe existir al menos un perfil' })
  }

  const result = db.prepare('DELETE FROM profiles WHERE id = ?').run(id)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Perfil no encontrado' })
  }

  res.status(204).end()
})

export default router
