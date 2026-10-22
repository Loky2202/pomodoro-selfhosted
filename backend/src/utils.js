export const DEFAULT_COLOR = '#ff7a66'

export function parseId(value) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0 ? n : null
}

export function clampInt(value, min, max, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function cleanText(value, maxLength = 80) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

export function isDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function localDay(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(day, delta) {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export function isValidColor(value) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

export function profileJson(row) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    workMinutes: row.work_minutes,
    shortBreakMinutes: row.short_break_minutes,
    longBreakMinutes: row.long_break_minutes,
    longBreakInterval: row.long_break_interval,
    autoStartBreaks: Boolean(row.auto_start_breaks),
    autoStartFocus: Boolean(row.auto_start_focus),
    soundEnabled: Boolean(row.sound_enabled),
    createdAt: row.created_at,
  }
}

export function presetJson(row) {
  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name,
    workMinutes: row.work_minutes,
    shortBreakMinutes: row.short_break_minutes,
    longBreakMinutes: row.long_break_minutes,
    longBreakInterval: row.long_break_interval,
    createdAt: row.created_at,
  }
}

export function sessionJson(row) {
  return {
    id: row.id,
    profileId: row.profile_id,
    presetId: row.preset_id,
    label: row.label,
    mode: row.mode,
    plannedSeconds: row.planned_seconds,
    actualSeconds: row.actual_seconds,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    day: row.day,
    hour: row.hour,
    createdAt: row.created_at,
  }
}
