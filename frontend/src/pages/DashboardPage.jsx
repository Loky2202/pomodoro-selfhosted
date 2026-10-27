import { useState } from 'react'
import { api } from '../api'
import { useApp } from '../context'
import {
  MODES,
  dayAndMonth,
  downloadSessionsCsv,
  formatDuration,
  formatTime,
  localDayKey,
  longDate,
  parseDay,
  relativeDay,
  sessionLabel,
} from '../utils'
import { EmptyState, PageHeader } from '../components/Layout'
import { ConfirmDialog, Modal, Segmented } from '../components/Form'
import { BarChart, DonutChart, Heatmap, HourChart } from '../components/Charts'
import {
  ArrowRight,
  Award,
  ChartBar,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  Flame,
  Sparkles,
  Target,
  Trash,
  TrendingUp,
} from '../components/Icons'

function StatCard({ icon: Icon, label, value, detail, tone = 'accent' }) {
  return (
    <section className="stat-card">
      <span className={`stat-icon stat-icon--${tone}`}>
        <Icon size={19} />
      </span>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        <span className="stat-detail">{detail}</span>
      </div>
    </section>
  )
}

function ChartSkeleton({ tall = false }) {
  return <div className={`chart-skeleton ${tall ? 'is-tall' : ''}`} aria-hidden="true" />
}

export default function DashboardPage() {
  const { activeProfile, stats, statsLoading, refreshStats, pushToast, navigate } = useApp()
  const [range, setRange] = useState(14)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [daySessions, setDaySessions] = useState([])
  const [dayLoading, setDayLoading] = useState(false)

  const accent = activeProfile.color
  const today = stats?.range?.to ?? localDayKey()
  const loading = statsLoading && !stats

  const series = stats?.series ?? []
  const totals = stats?.totals ?? {}
  const byLabel = (stats?.byLabel ?? []).filter((item) => item.seconds > 0)
  const byHour = stats?.byHour ?? []
  const recent = stats?.recent ?? []

  const rangeSeries = series.slice(-range)
  const rangeSeconds = rangeSeries.reduce((sum, item) => sum + item.seconds, 0)
  const labelTotal = byLabel.reduce((sum, item) => sum + item.seconds, 0)
  const hasData = (totals.allSeconds ?? 0) > 0 || recent.length > 0

  const monthSeconds = totals.monthSeconds ?? 0
  const monthCompleted = totals.monthCompleted ?? 0
  const weekSeconds = totals.weekSeconds ?? 0
  const weekCompleted = totals.weekCompleted ?? 0
  const averageSeconds = Math.round(monthSeconds / 30)

  async function exportCsv() {
    setExporting(true)
    try {
      const data = await api.getSessions(activeProfile.id, 1000)
      if (data.sessions.length === 0) {
        pushToast('No hay sesiones para exportar', 'info')
        return
      }
      downloadSessionsCsv(data.sessions, activeProfile.name)
      pushToast(`${data.sessions.length} sesiones exportadas`, 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setExporting(false)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await api.deleteSession(pendingDelete.id)
      pushToast('Sesión eliminada', 'success')
      setPendingDelete(null)
      refreshStats()
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function handleSelectDay(day) {
    if (selectedDay === day) {
      setSelectedDay(null)
      return
    }
    setSelectedDay(day)
    setDayLoading(true)
    try {
      const data = await api.getSessions(activeProfile.id, 1000)
      setDaySessions(data.sessions.filter((session) => session.day === day))
    } catch (error) {
      pushToast(error.message, 'error')
      setDaySessions([])
    } finally {
      setDayLoading(false)
    }
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Análisis"
        title="Resumen"
        subtitle={`${activeProfile.name} · actividad de los últimos 90 días`}
        actions={
          <button className="btn btn-ghost" onClick={exportCsv} disabled={exporting}>
            <Download size={17} />
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        }
      />

      <div className="stat-grid">
        <StatCard
          icon={Target}
          label="Enfoque hoy"
          value={loading ? '—' : formatDuration(totals.todaySeconds ?? 0)}
          detail={`${totals.todayCompleted ?? 0} sesión${
            (totals.todayCompleted ?? 0) === 1 ? '' : 'es'
          } completada${(totals.todayCompleted ?? 0) === 1 ? '' : 's'}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Últimos 7 días"
          value={loading ? '—' : formatDuration(weekSeconds)}
          detail={`${weekCompleted} sesiones completadas`}
          tone="teal"
        />
        <StatCard
          icon={Flame}
          label="Racha"
          value={loading ? '—' : `${stats?.streak ?? 0} día${(stats?.streak ?? 0) === 1 ? '' : 's'}`}
          detail="Días seguidos con enfoque"
          tone="amber"
        />
        <StatCard
          icon={Award}
          label="Media diaria"
          value={loading ? '—' : formatDuration(averageSeconds)}
          detail={`${stats?.activeDays ?? 0} días activos de 90`}
          tone="violet"
        />
      </div>

      <div className="insight-banner">
        <span className="insight-icon">
          <Sparkles size={18} />
        </span>
        <p>
          {hasData ? (
            <>
              En los últimos 30 días has enfocado <strong>{formatDuration(monthSeconds)}</strong> en{' '}
              <strong>{monthCompleted} sesiones</strong>.
              {stats?.bestDay && (
                <>
                  {' '}
                  Tu mejor día fue <strong>{dayAndMonth(stats.bestDay.day)}</strong> con{' '}
                  <strong>{formatDuration(stats.bestDay.seconds)}</strong>.
                </>
              )}
            </>
          ) : (
            <>Tu panel se llenará de datos en cuanto completes tu primera sesión de enfoque.</>
          )}
        </p>
        {!hasData && (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('timer')}>
            Empezar ahora <ArrowRight size={15} />
          </button>
        )}
      </div>

      <div className="dashboard-grid">
        <section className="card chart-card chart-card--wide">
          <div className="card-head">
            <div>
              <span className="eyebrow">Ritmo</span>
              <h2>Enfoque por día</h2>
            </div>
            <Segmented
              options={[
                { value: 7, label: '7 d' },
                { value: 14, label: '14 d' },
                { value: 30, label: '30 d' },
              ]}
              value={range}
              onChange={setRange}
            />
          </div>
          <div className="chart-summary">
            <strong>{formatDuration(rangeSeconds)}</strong>
            <span>en los últimos {range} días</span>
          </div>
          {loading ? (
            <ChartSkeleton tall />
          ) : rangeSeconds === 0 ? (
            <EmptyState icon={ChartBar} title="Sin actividad en este periodo">
              Completa un pomodoro para ver tu ritmo diario.
            </EmptyState>
          ) : (
            <BarChart data={rangeSeries} accent={accent} today={today} />
          )}
        </section>

        <section className="card chart-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">Etiquetas</span>
              <h2>Distribución</h2>
            </div>
          </div>
          <p className="chart-note">Tiempo de enfoque por etiqueta · últimos 30 días</p>
          {loading ? (
            <ChartSkeleton />
          ) : byLabel.length === 0 ? (
            <EmptyState icon={Target} title="Sin etiquetas todavía">
              Escribe una tarea en el temporizador para clasificar tu tiempo.
            </EmptyState>
          ) : (
            <DonutChart items={byLabel} totalSeconds={labelTotal} accent={accent} />
          )}
        </section>

        <section className="card chart-card chart-card--wide">
          <div className="card-head">
            <div>
              <span className="eyebrow">Constancia</span>
              <h2>Actividad de los últimos 90 días</h2>
            </div>
            <span className="legend-note">Cada celda es un día</span>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : hasData ? (
            <Heatmap
              data={series}
              accent={accent}
              today={today}
              onSelectDay={handleSelectDay}
              selectedDay={selectedDay}
            />
          ) : (
            <EmptyState icon={Flame} title="Aún no hay constancia que mostrar">
              Tus días de enfoque aparecerán aquí.
            </EmptyState>
          )}
        </section>

        <section className="card chart-card">
          <div className="card-head">
            <div>
              <span className="eyebrow">Hábitos</span>
              <h2>Horas más activas</h2>
            </div>
            <Clock size={18} className="muted-icon" />
          </div>
          <p className="chart-note">Enfoque por hora · últimos 30 días</p>
          {loading ? (
            <ChartSkeleton />
          ) : monthSeconds === 0 ? (
            <EmptyState icon={Clock} title="Sin datos por hora">
              Necesitamos algunas sesiones para detectar tus mejores horas.
            </EmptyState>
          ) : (
            <HourChart data={byHour} accent={accent} />
          )}
        </section>

        <section className="card chart-card chart-card--full">
          <div className="card-head">
            <div>
              <span className="eyebrow">Historial</span>
              <h2>Sesiones recientes</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={exportCsv} disabled={exporting}>
              <Download size={15} /> CSV
            </button>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Todavía no hay sesiones"
              action={
                <button className="btn btn-primary btn-sm" onClick={() => navigate('timer')}>
                  Empezar un pomodoro
                </button>
              }
            >
              Al terminar una sesión aparecerá aquí con su etiqueta y duración.
            </EmptyState>
          ) : (
            <ul className="session-list">
              {recent.map((session) => (
                <li key={session.id} className="session-row">
                  <span
                    className={`session-state ${session.status}`}
                    title={session.status === 'completed' ? 'Completada' : 'Cancelada'}
                  >
                    {session.status === 'completed' ? (
                      <CircleCheck size={17} />
                    ) : (
                      <CircleX size={17} />
                    )}
                  </span>
                  <div className="session-main">
                    <strong>
                      {session.mode === 'focus'
                        ? sessionLabel(session)
                        : MODES[session.mode]?.label}
                    </strong>
                    <span>
                      {relativeDay(session.day, today)} · {formatTime(session.startedAt)}
                      {session.status === 'cancelled' ? ' · Cancelada' : ''}
                    </span>
                  </div>
                  <span className={`mode-badge mode-${session.mode}`}>
                    {MODES[session.mode]?.label}
                  </span>
                  <span className="session-duration">
                    {formatDuration(session.actualSeconds)}
                  </span>
                  <button
                    className="icon-button icon-button--quiet"
                    onClick={() => setPendingDelete(session)}
                    aria-label="Eliminar sesión"
                    title="Eliminar sesión"
                  >
                    <Trash size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {selectedDay && (
        <Modal
          open={Boolean(selectedDay)}
          onClose={() => setSelectedDay(null)}
          title={longDate(parseDay(selectedDay))}
          subtitle="Detalle del día"
        >
          {dayLoading ? (
            <p className="hint">Cargando sesiones…</p>
          ) : daySessions.length === 0 ? (
            <EmptyState icon={Clock} title="Sin actividad este día">
              No se registraron sesiones en esta fecha.
            </EmptyState>
          ) : (
            <div>
              <div className="chart-summary" style={{ marginBottom: '16px' }}>
                <strong>
                  {formatDuration(daySessions.reduce((sum, s) => sum + s.actualSeconds, 0))}
                </strong>
                <span>tiempo total registrado</span>
              </div>
              <ul className="session-list">
                {daySessions.map((session) => (
                  <li key={session.id} className="session-row">
                    <span
                      className={`session-state ${session.status}`}
                      title={session.status === 'completed' ? 'Completada' : 'Cancelada'}
                    >
                      {session.status === 'completed' ? (
                        <CircleCheck size={17} />
                      ) : (
                        <CircleX size={17} />
                      )}
                    </span>
                    <div className="session-main">
                      <strong>
                        {session.mode === 'focus' || session.mode === 'stopwatch'
                          ? sessionLabel(session)
                          : MODES[session.mode]?.label}
                      </strong>
                      <span>{formatTime(session.startedAt)}</span>
                    </div>
                    <span className={`mode-badge mode-${session.mode}`}>
                      {MODES[session.mode]?.label}
                    </span>
                    <span className="session-duration">
                      {formatDuration(session.actualSeconds)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
        title="Eliminar sesión"
        confirmLabel="Eliminar sesión"
      >
        {pendingDelete && (
          <p>
            ¿Seguro que quieres eliminar la sesión de{' '}
            <strong>
              {pendingDelete.mode === 'focus'
                ? sessionLabel(pendingDelete)
                : MODES[pendingDelete.mode]?.label}
            </strong>{' '}
            del {relativeDay(pendingDelete.day, today)} ({formatDuration(pendingDelete.actualSeconds)})?
            Esta acción no se puede deshacer.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}
