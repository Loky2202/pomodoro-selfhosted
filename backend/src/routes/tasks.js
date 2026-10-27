import { Router } from 'express'
import { db } from '../db.js'
import { cleanText, parseId, taskJson } from '../utils.js'

const router = Router()

function findProfile(profileId) {
  return db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId)
}

router.get('/profiles/:profileId/tasks', (req, res) => {
  const profileId = parseId(req.params.profileId)
  if (!profileId) return res.status(400).json({ error: 'Perfil inválido' })
  if (!findProfile(profileId)) {
    return res.status(404).json({ error: 'Perfil no encontrado' })
  }

  const rows = db
    .prepare(
      `SELECT * FROM tasks
       WHERE profile_id = ?
       ORDER BY completed ASC, created_at DESC, id DESC`
    )
    .all(profileId)

  res.json(rows.map(taskJson))
})

router.post('/tasks', (req, res) => {
  const profileId = parseId(req.body?.profileId)
  if (!profileId) return res.status(400).json({ error: 'Perfil inválido' })
  if (!findProfile(profileId)) {
    return res.status(404).json({ error: 'Perfil no encontrado' })
  }

  const title = cleanText(req.body?.title, 120)
  if (!title) {
    return res.status(400).json({ error: 'El título de la tarea es obligatorio' })
  }

  const result = db
    .prepare('INSERT INTO tasks (profile_id, title) VALUES (?, ?)')
    .run(profileId, title)

  const row = db
    .prepare('SELECT * FROM tasks WHERE id = ?')
    .get(Number(result.lastInsertRowid))

  res.status(201).json(taskJson(row))
})

router.put('/tasks/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Tarea inválida' })

  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Tarea no encontrada' })

  const title =
    req.body?.title === undefined ? existing.title : cleanText(req.body.title, 120)
  if (!title) {
    return res.status(400).json({ error: 'El título de la tarea es obligatorio' })
  }

  let completed = existing.completed
  if (typeof req.body?.completed === 'boolean') {
    completed = req.body.completed ? 1 : 0
  }

  const completedAt = completed
    ? existing.completed
      ? existing.completed_at
      : new Date().toISOString()
    : null

  db.prepare(
    'UPDATE tasks SET title = ?, completed = ?, completed_at = ? WHERE id = ?'
  ).run(title, completed, completedAt, id)

  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
  res.json(taskJson(row))
})

router.delete('/tasks/:id', (req, res) => {
  const id = parseId(req.params.id)
  if (!id) return res.status(400).json({ error: 'Tarea inválida' })

  const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Tarea no encontrada' })
  }

  res.status(204).end()
})

export default router
