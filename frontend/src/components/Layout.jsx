import { useApp } from '../context'
import { initials } from '../utils'
import {
  ChartBar,
  Check,
  ChevronDown,
  Info,
  Timer,
  User,
  X,
  CircleX,
} from './Icons'

const NAV_ITEMS = [
  { id: 'timer', label: 'Temporizador', icon: Timer },
  { id: 'dashboard', label: 'Resumen', icon: ChartBar },
  { id: 'profiles', label: 'Perfiles', icon: User },
]

function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`}>
      <span className="brand-mark">
        <span className="brand-leaf" />
        <Timer size={19} strokeWidth={2} />
      </span>
      <span className="brand-text">
        <strong>Focus</strong>
        {!compact && <small>pomodoro</small>}
      </span>
    </div>
  )
}

function ProfileAvatar({ profile, small = false }) {
  return (
    <span
      className={`avatar ${small ? 'avatar--small' : ''}`}
      style={{
        color: profile.color,
        background: `${profile.color}1f`,
        borderColor: `${profile.color}55`,
      }}
    >
      {initials(profile.name)}
    </span>
  )
}

export function Sidebar() {
  const { profiles, activeProfile, activeId, setActiveId, view, navigate } = useApp()

  return (
    <aside className="sidebar">
      <button className="brand-button" onClick={() => navigate('timer')}>
        <Brand />
      </button>

      <nav className="nav" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'is-active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-tip">
        <span className="status-dot" />
        <p>Todo se guarda en tu servidor local.</p>
      </div>

      {activeProfile && (
        <div className="profile-card">
          <ProfileAvatar profile={activeProfile} />
          <div className="profile-card-text">
            <strong>{activeProfile.name}</strong>
            <span>Perfil activo</span>
          </div>
          <ChevronDown size={16} className="profile-card-chevron" />
          <select
            className="profile-select-ghost"
            value={activeId ?? ''}
            onChange={(event) => setActiveId(Number(event.target.value))}
            aria-label="Cambiar de perfil"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </aside>
  )
}

export function MobileHeader() {
  const { profiles, activeProfile, activeId, setActiveId, navigate } = useApp()

  return (
    <header className="mobile-header">
      <button className="brand-button" onClick={() => navigate('timer')}>
        <Brand compact />
      </button>
      {activeProfile && (
        <div className="mobile-profile">
          <ProfileAvatar profile={activeProfile} small />
          <select
            value={activeId ?? ''}
            onChange={(event) => setActiveId(Number(event.target.value))}
            aria-label="Cambiar de perfil"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </header>
  )
}

export function BottomNav() {
  const { view, navigate } = useApp()
  return (
    <nav className="bottom-nav" aria-label="Navegación">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${view === item.id ? 'is-active' : ''}`}
            onClick={() => navigate(item.id)}
          >
            <Icon size={21} />
            <span>{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  )
}

export function ToastStack() {
  const { toasts, dismissToast } = useApp()

  if (toasts.length === 0) return null

  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? (
              <Check size={16} />
            ) : toast.type === 'error' ? (
              <CircleX size={16} />
            ) : (
              <Info size={16} />
            )}
          </span>
          <p>{toast.message}</p>
          <button
            className="toast-close"
            onClick={() => dismissToast(toast.id)}
            aria-label="Cerrar aviso"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ icon: Icon = Info, title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={22} />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}
