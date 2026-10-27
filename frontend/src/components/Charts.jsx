import { dayAndMonth, formatDuration, parseDay, weekdayShort } from '../utils'

function niceMaxMinutes(maxMinutes) {
  if (maxMinutes <= 30) return 30
  if (maxMinutes <= 60) return 60
  const step = maxMinutes <= 180 ? 30 : maxMinutes <= 360 ? 60 : 120
  return Math.ceil(maxMinutes / step) * step
}

export function BarChart({ data, accent = '#ff7a66', today }) {
  const maxMinutes = Math.max(...data.map((item) => item.seconds / 60), 0)
  const ceiling = niceMaxMinutes(maxMinutes)
  const sampleEvery = Math.max(1, Math.ceil(data.length / 9))

  return (
    <div className="bar-chart">
      <div className="bar-chart-y">
        {[1, 0.75, 0.5, 0.25, 0].map((ratio) => (
          <span key={ratio} className="bar-chart-y-label" style={{ bottom: `${ratio * 100}%` }}>
            {formatDuration(ceiling * 60 * ratio)}
          </span>
        ))}
      </div>
      <div className="bar-chart-plot">
        <div className="bar-chart-lines" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <span key={ratio} style={{ bottom: `${ratio * 100}%` }} />
          ))}
        </div>
        <div className="bars">
          {data.map((item, index) => {
            const minutes = item.seconds / 60
            const height = ceiling === 0 ? 0 : (minutes / ceiling) * 100
            const isToday = item.day === today
            const showLabel =
              index === data.length - 1 || index % sampleEvery === 0 || data.length <= 7
            return (
              <div className="bar-col" key={item.day}>
                <div className="bar-track">
                  <div
                    className={`bar ${isToday ? 'is-today' : ''} ${minutes === 0 ? 'is-empty' : ''}`}
                    style={{
                      height: `${Math.max(height, minutes > 0 ? 3 : 0)}%`,
                      '--bar-color': accent,
                    }}
                    title={`${dayAndMonth(item.day)} · ${formatDuration(item.seconds, {
                      long: true,
                    })}`}
                  />
                </div>
                <span className={`bar-label ${showLabel ? '' : 'is-hidden'}`}>
                  {weekdayShort(item.day)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const DONUT_COLORS = ['#ff7a66', '#4fd1c5', '#8b5cf6', '#f5a524', '#38bdf8', '#f472b6', '#a3e635']

export function DonutChart({ items, totalSeconds, accent = '#ff7a66' }) {
  const total = Math.max(totalSeconds, 1)
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const palette = [accent, ...DONUT_COLORS.filter((color) => color !== accent)]
  let offset = 0

  const segments = items.slice(0, 7).map((item, index) => {
    const fraction = item.seconds / total
    const dash = fraction * circumference
    const segment = (
      <circle
        key={item.label}
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={palette[index % palette.length]}
        strokeWidth="15"
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        className="donut-segment"
      />
    )
    offset += dash
    return segment
  })

  return (
    <div className="donut-layout">
      <div className="donut-chart">
        <svg viewBox="0 0 140 140" role="img" aria-label="Distribución del tiempo por etiqueta">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="15" />
          <g transform="rotate(-90 70 70)">{segments}</g>
        </svg>
        <div className="donut-center">
          <strong>{formatDuration(totalSeconds)}</strong>
          <span>enfoque</span>
        </div>
      </div>
      <ul className="donut-legend">
        {items.slice(0, 6).map((item, index) => (
          <li key={item.label}>
            <span
              className="legend-dot"
              style={{ background: palette[index % palette.length] }}
            />
            <span className="legend-label" title={item.label}>
              {item.label}
            </span>
            <span className="legend-value">{formatDuration(item.seconds)}</span>
          </li>
        ))}
        {items.length > 6 && (
          <li className="legend-more">
            + {items.length - 6} etiqueta{items.length - 6 === 1 ? '' : 's'} más
          </li>
        )}
      </ul>
    </div>
  )
}

function heatLevel(seconds) {
  const minutes = seconds / 60
  if (minutes <= 0) return 0
  if (minutes < 20) return 1
  if (minutes < 45) return 2
  if (minutes < 90) return 3
  return 4
}

const HEAT_ALPHA = [0, 0.22, 0.4, 0.62, 0.9]

export function Heatmap({ data, accent = '#ff7a66', today, onSelectDay, selectedDay }) {
  const sorted = [...data].sort((a, b) => a.day.localeCompare(b.day))
  if (sorted.length === 0) return null

  const leading = (parseDay(sorted[0].day).getDay() + 6) % 7
  const cells = [
    ...Array.from({ length: leading }, () => null),
    ...sorted.map((item) => ({ ...item, level: heatLevel(item.seconds) })),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  const firstDay = sorted[0].day
  const lastDay = sorted[sorted.length - 1].day

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-weekdays" aria-hidden="true">
        <span>Lun</span>
        <span />
        <span>Mié</span>
        <span />
        <span>Vie</span>
        <span />
        <span />
      </div>
      <div className="heatmap-main">
        <div className="heatmap-grid">
          {weeks.flatMap((week, weekIndex) =>
            week.map((cell, dayIndex) => {
              if (!cell) {
                return <span key={`empty-${weekIndex}-${dayIndex}`} className="heat-cell is-empty" />
              }
              return (
                <button
                  key={cell.day}
                  type="button"
                  className={`heat-cell ${cell.day === today ? 'is-today' : ''} ${
                    cell.day === selectedDay ? 'is-selected' : ''
                  }`}
                  style={{
                    background:
                      cell.level === 0
                        ? 'rgba(255,255,255,0.045)'
                        : `${accent}${Math.round(HEAT_ALPHA[cell.level] * 255)
                            .toString(16)
                            .padStart(2, '0')}`,
                  }}
                  title={`${dayAndMonth(cell.day)} · ${formatDuration(cell.seconds, {
                    long: true,
                  })}`}
                  onClick={() => onSelectDay?.(cell.day)}
                />
              )
            })
          )}
        </div>
        <div className="heatmap-footer">
          <span>
            {dayAndMonth(firstDay)} — {dayAndMonth(lastDay)}
          </span>
          <span className="heatmap-scale">
            Menos
            {HEAT_ALPHA.map((alpha, level) => (
              <i
                key={level}
                style={{
                  background:
                    level === 0
                      ? 'rgba(255,255,255,0.045)'
                      : `${accent}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`,
                }}
              />
            ))}
            Más
          </span>
        </div>
      </div>
    </div>
  )
}

export function HourChart({ data, accent = '#ff7a66' }) {
  const max = Math.max(...data.map((item) => item.seconds), 1)
  return (
    <div className="hour-chart">
      {data.map((item) => (
        <div className="hour-col" key={item.hour}>
          <div
            className={`hour-bar ${item.seconds === 0 ? 'is-empty' : ''}`}
            style={{
              height: `${Math.max((item.seconds / max) * 100, item.seconds > 0 ? 5 : 2)}%`,
              '--bar-color': accent,
            }}
            title={`${String(item.hour).padStart(2, '0')}:00 · ${formatDuration(item.seconds, {
              long: true,
            })}`}
          />
          {item.hour % 6 === 0 && <span className="hour-label">{item.hour}h</span>}
        </div>
      ))}
    </div>
  )
}
