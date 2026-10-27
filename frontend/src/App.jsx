import { AppProvider, useApp } from './context'
import { BottomNav, MobileHeader, Sidebar, ToastStack } from './components/Layout'
import { RotateCcw, Timer } from './components/Icons'
import TimerPage from './pages/TimerPage'
import DashboardPage from './pages/DashboardPage'
import ProfilesPage from './pages/ProfilesPage'

function BootScreen({ message = 'Preparando tu espacio de enfoque…' }) {
  return (
    <div className="boot-screen">
      <div className="boot-brand">
        <span className="brand-mark brand-mark--large">
          <span className="brand-leaf" />
          <Timer size={26} strokeWidth={2} />
        </span>
        <div>
          <strong>Focus</strong>
          <span>pomodoro</span>
        </div>
      </div>
      <div className="boot-loader" />
      <p>{message}</p>
    </div>
  )
}

function ErrorScreen({ message, onRetry }) {
  return (
    <div className="boot-screen">
      <div className="boot-brand">
        <span className="brand-mark brand-mark--large">
          <span className="brand-leaf" />
          <Timer size={26} strokeWidth={2} />
        </span>
        <div>
          <strong>Focus</strong>
          <span>pomodoro</span>
        </div>
      </div>
      <h1>No se pudo cargar la aplicación</h1>
      <p>{message}</p>
      <button className="btn btn-primary" onClick={onRetry}>
        <RotateCcw size={16} /> Reintentar
      </button>
    </div>
  )
}

function Shell() {
  const { loading, loadError, retry, view, activeProfile } = useApp()

  if (loading && !activeProfile) {
    return <BootScreen />
  }

  if (loadError && !activeProfile) {
    return <ErrorScreen message={loadError} onRetry={retry} />
  }

  if (!activeProfile) {
    return <BootScreen message="Creando tu primer perfil…" />
  }

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <MobileHeader />
        <div className="main-inner">
          <div hidden={view !== 'timer'}>
            <TimerPage key={activeProfile.id} active={view === 'timer'} />
          </div>
          {view === 'dashboard' && <DashboardPage />}
          {view === 'profiles' && <ProfilesPage />}
        </div>
      </main>
      <BottomNav />
      <ToastStack />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
