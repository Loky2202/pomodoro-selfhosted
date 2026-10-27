import { Router } from 'express'
import { db } from '../db.js'
import {
  addDays,
  clampInt,
  isDay,
  localDay,
  parseId,
  sessionJson,
} from '../utils.js'

const router = Router()

router.get('/', (req, res) => {
  const profileId = parseId(req.query.profileId)
  if (!profileId) return res.status(400).json({ error: 'profileId es obligatorio' })

  const profile = db.prepare('SELECT id FROM profiles WHERE id = ?').get(profileId)
  if (!profile) return res.status(404).json({ error: 'Perfil no encontrado' })

  const days = clampInt(req.query.days, 7, 180, 14)
  const today = isDay(req.query.today) ? req.query.today : localDay()
  const from = addDays(today, -(days - 1))
  const weekStart = addDays(today, -6)
  const monthStart = addDays(today, -29)

  const totals = db
    .prepare(
      `SELECT
         COALESCE(SUM(actual_seconds), 0) AS all_seconds,
         COALESCE(SUM(CASE WHEN day >= ? THEN actual_seconds ELSE 0 END), 0) AS month_seconds,
         COALESCE(SUM(CASE WHEN day >= ? THEN actual_seconds ELSE 0 END), 0) AS week_seconds,
         COALESCE(SUM(CASE WHEN day = ? THEN actual_seconds ELSE 0 END), 0) AS today_seconds,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS all_completed,
         COALESCE(SUM(CASE WHEN day >= ? AND status = 'completed' THEN 1 ELSE 0 END), 0) AS month_completed,
         COALESCE(SUM(CASE WHEN day >= ? AND status = 'completed' THEN 1 ELSE 0 END), 0) AS week_completed,
         COALESCE(SUM(CASE WHEN day = ? AND status = 'completed' THEN 1 ELSE 0 END), 0) AS today_completed
       FROM sessions
       WHERE profile_id = ? AND mode IN ('focus', 'stopwatch')`
    )
    .get(monthStart, weekStart, today, monthStart, weekStart, today, profileId)

  const seriesRows = db
    .prepare(
      `SELECT day,
              COALESCE(SUM(actual_seconds), 0) AS seconds,
              COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) AS completed
       FROM sessions
       WHERE profile_id = ? AND mode IN ('focus', 'stopwatch') AND day >= ? AND day <= ?
       GROUP BY day
       ORDER BY day ASC`
    )
    .all(profileId, from, today)

  const byDay = new Map(seriesRows.map((row) => [row.day, row]))
  const series = []
  for (let i = 0; i < days; i += 1) {
    const day = addDays(from, i)
    const row = byDay.get(day)
    series.push({
      day,
      seconds: row ? row.seconds : 0,
      completed: row ? row.completed : 0,
    })
  }

  const labelRows = db
    .prepare(
      `SELECT COALESCE(NULLIF(TRIM(label), ''), 'Sin etiqueta') AS label,
              COALESCE(SUM(actual_seconds), 0) AS seconds,
              COUNT(*) AS sessions
       FROM sessions
       WHERE profile_id = ? AND mode IN ('focus', 'stopwatch') AND day >= ? AND day <= ?
             AND actual_seconds > 0
       GROUP BY COALESCE(NULLIF(TRIM(label), ''), 'Sin etiqueta')
       ORDER BY seconds DESC`
    )
    .all(profileId, monthStart, today)

  const hourRows = db
    .prepare(
      `SELECT hour, COALESCE(SUM(actual_seconds), 0) AS seconds
       FROM sessions
       WHERE profile_id = ? AND mode IN ('focus', 'stopwatch') AND day >= ? AND day <= ?
       GROUP BY hour
       ORDER BY hour ASC`
    )
    .all(profileId, monthStart, today)

  const byHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    seconds: hourRows.find((row) => row.hour === hour)?.seconds ?? 0,
  }))

  const completedDays = db
    .prepare(
      `SELECT DISTINCT day
       FROM sessions
       WHERE profile_id = ? AND mode IN ('focus', 'stopwatch') AND status = 'completed'
       ORDER BY day DESC
       LIMIT 500`
    )
    .all(profileId)
    .map((row) => row.day)

  const completedSet = new Set(completedDays)
  let cursor = completedSet.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (completedSet.has(cursor)) {
    streak += 1
    cursor = addDays(cursor, -1)
  }

  let bestDay = null
  let activeDays = 0
  for (const entry of series) {
    if (entry.seconds > 0) activeDays += 1
    if (!bestDay || entry.seconds > bestDay.seconds) {
      bestDay = entry.seconds > 0 ? entry : null
    }
  }

  const recent = db
    .prepare(
      `SELECT * FROM sessions
       WHERE profile_id = ?
       ORDER BY started_at DESC, id DESC
       LIMIT 10`
    )
    .all(profileId)

  res.json({
    range: { days, from, to: today },
    totals: {
      todaySeconds: totals.today_seconds,
      weekSeconds: totals.week_seconds,
      monthSeconds: totals.month_seconds,
      allSeconds: totals.all_seconds,
      todayCompleted: totals.today_completed,
      weekCompleted: totals.week_completed,
      monthCompleted: totals.month_completed,
      allCompleted: totals.all_completed,
    },
    series,
    byLabel: labelRows,
    byHour,
    streak,
    bestDay,
    activeDays,
    recent: recent.map(sessionJson),
  })
})

export default router
