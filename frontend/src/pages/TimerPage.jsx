import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { useApp } from '../context'
import { useLocalStorage } from '../hooks'
import {
  MODES,
  formatClock,
  formatDuration,
  formatTimerMinutes,
  greeting,
  localDayKey,
  longDate,
  notify,
  playChime,
} from '../utils'
import { PageHeader } from '../components/Layout'
import { Segmented } from '../components/Form'
import {
  ArrowRight,
  Coffee,
  Flame,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Sparkles,
  Target,
  X,
} from '../components/Icons'

function readSavedTimer(key) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

function nextModeAfter(completedMode, cycle, interval) {
  if (completedMode === 'focus') {
    const nextCycle = cycle + 1
    if (nextCycle >= interval) return { mode: 'long', cycle: nextCycle }
    return { mode: 'short', cycle: nextCycle }
  }
  if (completedMode === 'long') return { mode: 'focus', cycle: 0 }
  return { mode: 'focus', cycle }
}

function TimerRing({ progress, accent }) {
  const radius = 140
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(1, Math.max(0, progress)))

  return (
    <svg className="timer-ring" viewBox="0 0 320 320" aria-hidden="true">
      <circle
        cx="160"
        cy="160"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.055)"
        strokeWidth="9"
      />
      <circle
        cx="160"
        cy="160"
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 160 160)"
        className="timer-ring-progress"
        style={{ filter: `drop-shadow(0 0 14px ${accent}66)` }}
      />
      <circle cx="160" cy="16" r="3.5" fill={accent} opacity="0.9" />
    </svg>
  )
}

export default function TimerPage() {
  const {
    activeProfile,
    presets,
    stats,
    statsLoading,
    refreshStats,
    pushToast,
  } = useApp()
  const profileId = activeProfile.id

  const storageKey = `pomodoro.timer.${profileId}`
  const [presetId, setPresetId] = useLocalStorage(`pomodoro.preset.${profileId}`, null)
  const [label, setLabel] = useLocalStorage(`pomodoro.label.${profileId}`, '')

  const selectedPreset = presets.find((preset) => preset.id === presetId) ?? null

  const durations = useMemo(
    () => ({
      focus: (selectedPreset?.workMinutes ?? activeProfile.workMinutes) * 60,
      short: (selectedPreset?.shortBreakMinutes ?? activeProfile.shortBreakMinutes) * 60,
      long: (selectedPreset?.longBreakMinutes ?? activeProfile.longBreakMinutes) * 60,
      interval: selectedPreset?.longBreakInterval ?? activeProfile.longBreakInterval,
    }),
    [selectedPreset, activeProfile]
  )

  const [restored] = useState(() => readSavedTimer(storageKey))
  const initialMode = restored && MODES[restored.mode] ? restored.mode : 'focus'
  const [mode, setMode] = useState(initialMode)
  const [status, setStatus] = useState('idle')
  const [cycle, setCycle] = useState(
    Number.isInteger(restored?.cycle) ? Math.max(0, restored.cycle) : 0
  )
  const [remaining, setRemaining] = useState(() => {
    const fallback =
      initialMode === 'focus'
        ? durations.focus
        : initialMode === 'short'
          ? durations.short
          : durations.long
    const saved = Number(restored?.remaining)
    if (Number.isFinite(saved) && saved > 0 && saved <= fallback) return saved
    return fallback
  })

  const modeRef = useRef(initialMode)
  const plannedRef = useRef(remaining)
  const startedAtRef = useRef(null)
  const endAtRef = useRef(null)
  const cycleRef = useRef(cycle)
  const intervalRef = useRef(durations.interval)
  const finishingRef = useRef(false)
  const restoredRef = useRef(false)

  const durationFor = useCallback(
    (targetMode) =>
      targetMode === 'focus'
        ? durations.focus
        : targetMode === 'short'
          ? durations.short
          : durations.long,
    [durations]
  )

  const logSession = useCallback(
    async ({ logMode, sessionStatus, plannedSeconds, actualSeconds, startedAt, endedAt }) => {
      if (!startedAt || !actualSeconds || actualSeconds < 1) return
      try {
        const startDate = new Date(startedAt)
        await api.createSession({
          profileId,
          presetId: selectedPreset?.id ?? null,
          label,
          mode: logMode,
          plannedSeconds,
          actualSeconds,
          status: sessionStatus,
          startedAt,
          endedAt: endedAt || new Date().toISOString(),
          day: localDayKey(startDate),
          hour: startDate.getHours(),
        })
        refreshStats()
      } catch (error) {
        pushToast(error.message, 'error')
      }
    },
    [profileId, selectedPreset?.id, label, refreshStats, pushToast]
  )

  const applyMode = useCallback(
    (nextMode, { autoStart = false } = {}) => {
      const seconds = durationFor(nextMode)
      modeRef.current = nextMode
      plannedRef.current = seconds
      startedAtRef.current = null
      endAtRef.current = null
      setMode(nextMode)
      setRemaining(seconds)

      if (autoStart) {
        const now = Date.now()
        finishingRef.current = false
        startedAtRef.current = new Date(now).toISOString()
        endAtRef.current = now + seconds * 1000
        setStatus('running')
      } else {
        setStatus('idle')
      }
    },
    [durationFor]
  )

  const handleComplete = useCallback(() => {
    const completedMode = modeRef.current
    const plannedSeconds = plannedRef.current
    const startedAt = startedAtRef.current
    endAtRef.current = null

    if (startedAt) {
      logSession({
        logMode: completedMode,
        sessionStatus: 'completed',
        plannedSeconds,
        actualSeconds: plannedSeconds,
        startedAt,
        endedAt: new Date().toISOString(),
      })
    }

    if (activeProfile.soundEnabled) playChime()
    notify(
      completedMode === 'focus' ? 'Enfoque completado' : 'Descanso terminado',
      completedMode === 'focus'
        ? 'Toca descansar un momento.'
        : 'Vuelve al enfoque cuando estés listo.'
    )

    const next = nextModeAfter(completedMode, cycleRef.current, intervalRef.current)
    cycleRef.current = next.cycle
    setCycle(next.cycle)

    const autoStart =
      completedMode === 'focus' ? activeProfile.autoStartBreaks : activeProfile.autoStartFocus
    applyMode(next.mode, { autoStart })
  }, [activeProfile, applyMode, logSession])

  const startOrResume = useCallback(() => {
    if (status === 'running') {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
      endAtRef.current = null
      setRemaining(left)
      setStatus('paused')
      return
    }

    const seconds = Math.max(1, status === 'paused' ? remaining : durationFor(mode))
    if (status !== 'paused') {
      plannedRef.current = seconds
      setRemaining(seconds)
    }
    if (!startedAtRef.current) startedAtRef.current = new Date().toISOString()

    const now = Date.now()
    endAtRef.current = now + seconds * 1000
    finishingRef.current = false
    setStatus('running')
  }, [status, remaining, mode, durationFor])

  const resetTimer = useCallback(() => {
    const planned = plannedRef.current || durationFor(mode)
    const left =
      status === 'running' && endAtRef.current
        ? Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
        : remaining
    const elapsed = Math.max(0, planned - left)

    if (startedAtRef.current && elapsed >= 30) {
      logSession({
        logMode: mode,
        sessionStatus: 'cancelled',
        plannedSeconds: planned,
        actualSeconds: elapsed,
        startedAt: startedAtRef.current,
        endedAt: new Date().toISOString(),
      })
      pushToast('Sesión guardada como cancelada', 'info')
    }

    endAtRef.current = null
    startedAtRef.current = null
    finishingRef.current = false
    const seconds = durationFor(mode)
    plannedRef.current = seconds
    setRemaining(seconds)
    setStatus('idle')
  }, [status, remaining, mode, durationFor, logSession, pushToast])

  const changeMode = useCallback(
    (nextMode) => {
      if (nextMode === mode || status === 'running') return
      if (status === 'paused' && startedAtRef.current) {
        const elapsed = Math.max(0, plannedRef.current - remaining)
        if (elapsed >= 30) {
          logSession({
            logMode: mode,
            sessionStatus: 'cancelled',
            plannedSeconds: plannedRef.current,
            actualSeconds: elapsed,
            startedAt: startedAtRef.current,
            endedAt: new Date().toISOString(),
          })
          pushToast('Sesión guardada como cancelada', 'info')
        }
      }
      startedAtRef.current = null
      finishingRef.current = false
      applyMode(nextMode)
    },
    [mode, status, remaining, applyMode, logSession, pushToast]
  )

  const skipBreak = useCallback(() => {
    if (mode === 'focus') return
    if (mode === 'long') {
      cycleRef.current = 0
      setCycle(0)
    }
    startedAtRef.current = null
    finishingRef.current = false
    applyMode('focus')
  }, [mode, applyMode])

  const handlePresetChange = useCallback(
    (value) => {
      if (status !== 'idle') return
      setPresetId(value === '' ? null : Number(value))
    },
    [status, setPresetId]
  )

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    cycleRef.current = cycle
  }, [cycle])

  useEffect(() => {
    intervalRef.current = durations.interval
  }, [durations.interval])

  useEffect(() => {
    if (presetId && presets.length > 0 && !presets.some((preset) => preset.id === presetId)) {
      setPresetId(null)
    }
  }, [presets, presetId, setPresetId])

  useEffect(() => {
    if (status === 'idle') {
      const seconds = durationFor(mode)
      plannedRef.current = seconds
      setRemaining(seconds)
    }
    // Solo re-sincroniza cuando cambian las duraciones, no en cada tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durations.focus, durations.short, durations.long])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          mode,
          status,
          remaining,
          endAt: endAtRef.current,
          startedAt: startedAtRef.current,
          planned: plannedRef.current,
          cycle,
        })
      )
    } catch {
      // Sin persistencia si el almacenamiento está bloqueado.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, status, mode, cycle])

  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    if (!restored) return

    const savedMode = MODES[restored.mode] ? restored.mode : 'focus'
    const fallback = durationFor(savedMode)
    const savedPlanned = Number(restored.planned)
    const plannedSeconds =
      Number.isFinite(savedPlanned) && savedPlanned > 0 ? savedPlanned : fallback
    const savedRemaining = Number(restored.remaining)

    if (restored.status === 'running' && Number.isFinite(Number(restored.endAt))) {
      const endAt = Number(restored.endAt)
      if (endAt > Date.now()) {
        const startedAt =
          restored.startedAt || new Date(endAt - plannedSeconds * 1000).toISOString()
        modeRef.current = savedMode
        plannedRef.current = plannedSeconds
        startedAtRef.current = startedAt
        endAtRef.current = endAt
        setMode(savedMode)
        setRemaining(Math.max(1, Math.ceil((endAt - Date.now()) / 1000)))
        setStatus('running')
        return
      }

      const startedAt =
        restored.startedAt ||
        new Date(endAt - plannedSeconds * 1000).toISOString()
      logSession({
        logMode: savedMode,
        sessionStatus: 'completed',
        plannedSeconds,
        actualSeconds: plannedSeconds,
        startedAt,
        endedAt: new Date(endAt).toISOString(),
      })
      const next = nextModeAfter(savedMode, cycleRef.current, intervalRef.current)
      cycleRef.current = next.cycle
      setCycle(next.cycle)
      modeRef.current = next.mode
      const seconds = durationFor(next.mode)
      plannedRef.current = seconds
      setMode(next.mode)
      setRemaining(seconds)
      pushToast('Una sesión terminó mientras estabas fuera. Progreso guardado.', 'success')
      setStatus('idle')
      return
    }

    if (restored.status === 'paused' && savedRemaining > 0) {
      modeRef.current = savedMode
      plannedRef.current = plannedSeconds
      startedAtRef.current = restored.startedAt || null
      setMode(savedMode)
      setRemaining(Math.min(savedRemaining, fallback))
      setStatus('paused')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (status !== 'running' || !endAtRef.current) return undefined
    const update = () => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
      setRemaining(left)
      if (left <= 0 && !finishingRef.current) {
        finishingRef.current = true
        handleComplete()
      }
    }
    update()
    const interval = window.setInterval(update, 250)
    return () => window.clearInterval(interval)
  }, [status, handleComplete])

  useEffect(() => {
    if (status === 'running') {
      document.title = `${formatClock(remaining)} · ${MODES[mode].label}`
    } else if (status === 'paused') {
      document.title = `Pausa · ${formatClock(remaining)}`
    } else {
      document.title = 'Focus · Pomodoro'
    }
  }, [status, remaining, mode])

  useEffect(() => {
    const onKeyDown = (event) => {
      const tag = event.target?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return
      if (document.querySelector('.modal-overlay')) return
      if (event.code === 'Space') {
        event.preventDefault()
        startOrResume()
      } else if (event.key.toLowerCase() === 'r') {
        resetTimer()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [startOrResume, resetTimer])

  const totalSeconds = status === 'idle' ? durationFor(mode) : plannedRef.current || durationFor(mode)
  const progress = totalSeconds > 0 ? remaining / totalSeconds : 1
  const modeAccent = mode === 'focus' ? activeProfile.color : '#4fd1c5'
  const isRunning = status === 'running'
  const isPaused = status === 'paused'

  const statusText = isRunning
    ? mode === 'focus'
      ? 'Concéntrate en una sola cosa'
      : 'Respira y descansa'
    : isPaused
      ? 'En pausa'
      : 'Listo para empezar'

  const todaySeconds = stats?.totals?.todaySeconds ?? 0
  const todayCompleted = stats?.totals?.todayCompleted ?? 0
  const weekSeconds = stats?.totals?.weekSeconds ?? 0
  const streak = stats?.streak ?? 0
  const labelValue = typeof label === 'string' ? label : ''

  return (
    <div className="page timer-page">
      <PageHeader
        eyebrow={greeting()}
        title="Temporizador"
        subtitle={longDate()}
        actions={
          <label className={`preset-picker ${status !== 'idle' ? 'is-locked' : ''}`}>
            <span>
              <Sparkles size={15} /> Perfil de sesión
            </span>
            <select
              value={presetId ?? ''}
              onChange={(event) => handlePresetChange(event.target.value)}
              disabled={status !== 'idle'}
              title={status !== 'idle' ? 'Reinicia la sesión para cambiar de perfil' : undefined}
            >
              <option value="">{activeProfile.name} · predeterminado</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} · {preset.workMinutes}/{preset.shortBreakMinutes} min
                </option>
              ))}
            </select>
          </label>
        }
      />

      <div className="timer-layout">
        <section className="card timer-card">
          <div className="timer-top">
            <Segmented
              options={[
                { value: 'focus', label: 'Enfoque' },
                { value: 'short', label: 'Descanso corto' },
                { value: 'long', label: 'Descanso largo' },
              ]}
              value={mode}
              onChange={changeMode}
              disabled={isRunning}
            />
            <span className={`timer-status ${isRunning ? 'is-running' : ''}`}>
              <i style={{ background: isRunning ? modeAccent : 'var(--muted)' }} />
              {isRunning ? 'En marcha' : isPaused ? 'Pausado' : 'En espera'}
            </span>
          </div>

          <div className="ring-stage">
            <span
              className="ring-glow"
              style={{ background: `radial-gradient(circle, ${modeAccent}26 0%, transparent 68%)` }}
            />
            <TimerRing progress={progress} accent={modeAccent} />
            <div className="ring-content">
              <span className="ring-mode" style={{ color: modeAccent }}>
                {mode === 'focus' ? 'Enfoque' : 'Descanso'}
              </span>
              <strong className="ring-time">{formatClock(remaining)}</strong>
              <span className="ring-sub">{statusText}</span>
            </div>
          </div>

          <div className="timer-controls">
            <button
              className="round-button"
              onClick={resetTimer}
              aria-label="Reiniciar temporizador"
              title="Reiniciar (R)"
            >
              <RotateCcw size={20} />
            </button>

            <button
              className="timer-main-button"
              onClick={startOrResume}
              style={{ '--accent': modeAccent }}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} />}
              <span>{isRunning ? 'Pausar' : isPaused ? 'Reanudar' : 'Empezar'}</span>
            </button>

            {mode !== 'focus' ? (
              <button
                className="round-button"
                onClick={skipBreak}
                aria-label="Saltar descanso"
                title="Saltar descanso"
              >
                <SkipForward size={20} />
              </button>
            ) : (
              <span className="round-spacer" aria-hidden="true" />
            )}
          </div>

          <div className="cycle-row">
            <div className="pips" aria-label={`${cycle} de ${durations.interval} sesiones completadas`}>
              {Array.from({ length: durations.interval }, (_, index) => (
                <span
                  key={index}
                  className={`pip ${index < cycle ? 'is-done' : ''}`}
                  style={index < cycle ? { background: activeProfile.color } : undefined}
                />
              ))}
            </div>
            <span>
              Descanso largo tras {durations.interval} sesión{durations.interval === 1 ? '' : 'es'}
            </span>
          </div>
        </section>

        <aside className="timer-side">
          <section className="card">
            <div className="card-head">
              <div>
                <span className="eyebrow">Sesión actual</span>
                <h2>¿En qué vas a trabajar?</h2>
              </div>
              <span className="icon-chip" style={{ color: activeProfile.color }}>
                <Target size={18} />
              </span>
            </div>

            <label className="task-input">
              <input
                type="text"
                placeholder="Ej. Diseño de la landing"
                value={labelValue}
                onChange={(event) => setLabel(event.target.value.slice(0, 80))}
                maxLength={80}
              />
              {labelValue && (
                <button
                  type="button"
                  onClick={() => setLabel('')}
                  aria-label="Borrar etiqueta"
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <p className="hint">
              La etiqueta se guarda con cada sesión para tus resúmenes y gráficas.
            </p>

            <div className="session-meta">
              <div>
                <span>Enfoque</span>
                <strong>{formatTimerMinutes(Math.round(durations.focus / 60))}</strong>
              </div>
              <div>
                <span>Descanso</span>
                <strong>{formatTimerMinutes(Math.round(durations.short / 60))}</strong>
              </div>
              <div>
                <span>Descanso largo</span>
                <strong>{formatTimerMinutes(Math.round(durations.long / 60))}</strong>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <span className="eyebrow">Tu día</span>
                <h2>Resumen rápido</h2>
              </div>
              <span className="icon-chip icon-chip--teal">
                <Flame size={18} />
              </span>
            </div>

            <div className="mini-stats">
              <div>
                <span>Enfoque hoy</span>
                <strong>{statsLoading && !stats ? '—' : formatDuration(todaySeconds)}</strong>
              </div>
              <div>
                <span>Sesiones</span>
                <strong>{statsLoading && !stats ? '—' : todayCompleted}</strong>
              </div>
              <div>
                <span>Racha</span>
                <strong>
                  {statsLoading && !stats ? '—' : `${streak} día${streak === 1 ? '' : 's'}`}
                </strong>
              </div>
              <div>
                <span>Últimos 7 días</span>
                <strong>{statsLoading && !stats ? '—' : formatDuration(weekSeconds)}</strong>
              </div>
            </div>

            <div className="auto-start-note">
              <Coffee size={16} />
              <p>
                Descansos automáticos{' '}
                <strong>{activeProfile.autoStartBreaks ? 'activados' : 'desactivados'}</strong>.
                Enfoque automático{' '}
                <strong>{activeProfile.autoStartFocus ? 'activado' : 'desactivado'}</strong>.
              </p>
            </div>
          </section>

          <section className="card card--subtle shortcuts-card">
            <div className="shortcut-row">
              <span className="key">Espacio</span>
              <span>Iniciar o pausar</span>
            </div>
            <div className="shortcut-row">
              <span className="key">R</span>
              <span>Reiniciar sesión</span>
            </div>
            <div className="shortcut-row">
              <ArrowRight size={14} />
              <span>Los cambios se sincronizan con tu servidor local.</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
