import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api } from './api'
import { useLocalStorage } from './hooks'
import { localDayKey } from './utils'

const AppContext = createContext(null)

const VIEWS = ['timer', 'dashboard', 'profiles']

function initialView() {
  const hash = window.location.hash.replace('#', '')
  return VIEWS.includes(hash) ? hash : 'timer'
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp debe usarse dentro de AppProvider')
  return context
}

export function AppProvider({ children }) {
  const [profiles, setProfiles] = useState([])
  const [activeId, setActiveId] = useLocalStorage('pomodoro.activeProfile', null)
  const [view, setView] = useLocalStorage('pomodoro.view', initialView())
  const [presets, setPresets] = useState([])
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsVersion, setStatsVersion] = useState(0)
  const [toasts, setToasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const pushToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const refreshProfiles = useCallback(async () => {
    const list = await api.getProfiles()
    setProfiles(list)
    return list
  }, [])

  const retry = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const list = await api.getProfiles()
      setProfiles(list)
    } catch (error) {
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await api.getProfiles()
        if (!cancelled) {
          setProfiles(list)
          setLoadError(null)
        }
      } catch (error) {
        if (!cancelled) setLoadError(error.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (profiles.length === 0) return
    if (!profiles.some((profile) => profile.id === activeId)) {
      setActiveId(profiles[0].id)
    }
  }, [profiles, activeId, setActiveId])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '')
    if (VIEWS.includes(hash)) setView(hash)
    // Solo al montar: permite enlaces directos a #dashboard o #profiles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeId) ?? null,
    [profiles, activeId]
  )

  useEffect(() => {
    if (!activeProfile) {
      setPresets([])
      return undefined
    }
    let cancelled = false
    api
      .getPresets(activeProfile.id)
      .then((list) => {
        if (!cancelled) setPresets(list)
      })
      .catch((error) => {
        if (!cancelled) pushToast(error.message, 'error')
      })
    return () => {
      cancelled = true
    }
  }, [activeProfile?.id, pushToast])

  const refreshPresets = useCallback(async () => {
    if (!activeProfile) return []
    const list = await api.getPresets(activeProfile.id)
    setPresets(list)
    return list
  }, [activeProfile])

  const refreshStats = useCallback(() => {
    setStatsVersion((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!activeProfile) {
      setStats(null)
      setStatsLoading(false)
      return undefined
    }
    let cancelled = false
    setStatsLoading(true)
    api
      .getStats(activeProfile.id, 90, localDayKey())
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((error) => {
        if (!cancelled) pushToast(error.message, 'error')
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeProfile?.id, statsVersion, pushToast])

  const navigate = useCallback(
    (nextView) => {
      if (!VIEWS.includes(nextView)) return
      setView(nextView)
      if (window.location.hash !== `#${nextView}`) {
        window.history.replaceState(null, '', `#${nextView}`)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [setView]
  )

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (VIEWS.includes(hash)) setView(hash)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [setView])

  const value = {
    profiles,
    activeProfile,
    activeId,
    setActiveId,
    presets,
    refreshPresets,
    refreshProfiles,
    stats,
    statsLoading,
    refreshStats,
    toasts,
    pushToast,
    dismissToast,
    loading,
    loadError,
    retry,
    view,
    navigate,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
