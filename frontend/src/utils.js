export const MODES = {
  focus: {
    label: 'Enfoque',
    longLabel: 'Sesión de enfoque',
    shortLabel: 'Enfoque',
  },
  short: {
    label: 'Descanso corto',
    longLabel: 'Descanso corto',
    shortLabel: 'Descanso',
  },
  long: {
    label: 'Descanso largo',
    longLabel: 'Descanso largo',
    shortLabel: 'Descanso largo',
  },
  stopwatch: {
    label: 'Cronómetro',
    longLabel: 'Tiempo indefinido',
    shortLabel: 'Tiempo',
  },
}

export function pad(value) {
  return String(value).padStart(2, '0')
}

export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(rest)}`
  return `${pad(minutes)}:${pad(rest)}`
}

export function formatDuration(totalSeconds, { long = false } = {}) {
  const totalMinutes = Math.round((Number(totalSeconds) || 0) / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (long) {
    if (hours === 0) return `${minutes} min`
    if (minutes === 0) return `${hours} h`
    return `${hours} h ${minutes} min`
  }
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function formatTimerMinutes(minutes) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export function localDayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDay(day) {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year, month - 1, date)
}

export function addDaysKey(day, delta) {
  const date = parseDay(day)
  date.setDate(date.getDate() + delta)
  return localDayKey(date)
}

export function weekdayShort(day) {
  const label = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(parseDay(day))
  return label.replace('.', '')
}

export function dayAndMonth(day) {
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })
    .format(parseDay(day))
    .replace('.', '')
}

export function longDate(date = new Date()) {
  const text = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatTime(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(date)
}

export function relativeDay(day, today = localDayKey()) {
  if (day === today) return 'Hoy'
  if (day === addDaysKey(today, -1)) return 'Ayer'
  const diff = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${day}T00:00:00Z`)) / 86400000
  )
  if (diff > 1 && diff < 7) return `Hace ${diff} días`
  return dayAndMonth(day)
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 6) return 'Buenas noches'
  if (hour < 13) return 'Buenos días'
  if (hour < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function sessionLabel(session) {
  return session.label?.trim() || 'Sin etiqueta'
}

export function downloadSessionsCsv(sessions, profileName = 'perfil') {
  const header = [
    'Fecha',
    'Hora',
    'Modo',
    'Etiqueta',
    'Estado',
    'Planificado (min)',
    'Real (min)',
    'Inicio',
    'Fin',
  ]

  const rows = sessions.map((session) => [
    session.day,
    formatTime(session.startedAt),
    MODES[session.mode]?.label ?? session.mode,
    sessionLabel(session),
    session.status === 'completed' ? 'Completada' : 'Cancelada',
    Math.round(session.plannedSeconds / 60),
    Math.round(session.actualSeconds / 60),
    session.startedAt,
    session.endedAt,
  ])

  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = [header, ...rows].map((row) => row.map(escape).join(';')).join('\r\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pomodoro-${profileName.toLowerCase().replaceAll(/\s+/g, '-')}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = new AudioContext()
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const start = context.currentTime + index * 0.18
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.16, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.6)
    })
    setTimeout(() => context.close(), 1500)
  } catch {
    // El navegador puede bloquear el audio hasta que haya interacción.
  }
}

export function notify(title, body) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.svg' })
  } catch {
    // Algunos navegadores móviles no permiten notificaciones desde la página.
  }
}
