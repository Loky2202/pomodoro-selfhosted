import { Router } from 'express'
import { db } from '../db.js'
import { clampInt, cleanText, parseId, presetJson } from '../utils.js'

const router = Router()

function readPresetInput(body, existing = null) {
  const base = existing
    ? presetJson(existing)
    : {
        name: '',
        workMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        longBreakInterval: 4,
      }

  return {
    name: cleanText(body?.name, 40) || base.name,
    workMinutes: clampInt(body?.workMinutes, 1, 180, base.workMinutes),
    shortBreakMinutes: clampInt(body?.shortBreakMinutes, 1, 120, base.shortBreakMinutes),
    longBreakMinutes: clampInt(body?.longBreakMinutes, 1, 180, base.longBreakMinutes),
    longBreakInterval: clampInt(body?.longBreakInterval, 2, 12, base.longBreakInterval),
  }
}

router.get('/profiles/:profileId/presets', (req, res) => {
  const profileId = parseId(req.params.profileId)
  if (!profileId) return res.status(400).json({ error: 'Perfil inválido' })

  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId)
  if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' })

  const rows = db
    .prepare('SELECT * FROM presets WHERE profile_id = ? ORDER BY id ASC')
    .all(profileId)
  res.json(rows.map(presetJson))
})

router.post('/presets', (req, res) => {
  const profileId = parseId(req.body?.profileId)
  if (!profileId) return res.status(400).json({ error: 'Perfil inválido' })

  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId)
  if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' })

  const input = readPresetInput(req.body)
  if (!input.name) {
    return res.status(400).json({ error: 'El nombre del perfil de sesión es obligatorio' })
  }

  const result = db
    .prepare(
      `INSERT INTO presets
        (profile_id, name, work_minutes, short_break_minutes, long_break_minutes, long_break_interval)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      profileId,
      input.name,
      input.workMinutes,
      input.shortBreakMinutes,
      input.longBreakMinutes,
      input.longBreakInterval
    )

  const row = db
    .prepare('SELECT * FROM presets WHERE id = ?')
    .get(Number(result.lastInsertRowid))
  res.status(201).json(presetJson(row))
})

router.put('/presets/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Perfil de sesión inválido' })

  const existing = db.prepare('SELECT * FROM presets WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Perfil de sesión no encontrado' })

  const input = readPresetInput(req.body, existing)
  if (!input.name) {
    return res.status(400).json({ error: 'El nombre del perfil de sesión es obligatorio' })
  }

  db.prepare(
    `UPDATE presets SET
       name = ?, work_minutes = ?, short_break_minutes = ?,
       long_break_minutes = ?, long_break_interval = ?
     WHERE id = ?`
  ).run(
    input.name,
    input.workMinutes,
    input.shortBreakMinutes,
    input.longBreakMinutes,
    input.longBreakInterval,
    id
  )

  const row = db.prepare('SELECT * FROM presets WHERE id = ?').get(id)
  res.json(presetJson(row))
})

router.delete('/presets/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Perfil de sesión inválido' })

  const result = db.prepare('DELETE FROM presets WHERE id = ?').run(id)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Perfil de sesión no encontrado' })
  }

  res.status(204).end()
})

export default router
