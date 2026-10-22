import { useEffect, useState } from 'react'
import { api } from '../api'
import { useApp } from '../context'
import { initials } from '../utils'
import { EmptyState, PageHeader } from '../components/Layout'
import {
  ColorPicker,
  ConfirmDialog,
  Modal,
  NumberField,
  TextField,
  Toggle,
} from '../components/Form'
import {
  ArrowRight,
  Bell,
  Check,
  Info,
  Pencil,
  Play,
  Plus,
  Sliders,
  Sparkles,
  Trash,
  Volume2,
  VolumeX,
} from '../components/Icons'

const EMPTY_PROFILE = {
  name: '',
  color: '#ff7a66',
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  soundEnabled: true,
}

const EMPTY_PRESET = {
  name: '',
  workMinutes: 50,
  shortBreakMinutes: 10,
  longBreakMinutes: 25,
  longBreakInterval: 3,
}

function ProfileFormModal({ open, profile, onClose }) {
  const { refreshProfiles, setActiveId, pushToast } = useApp()
  const [form, setForm] = useState(EMPTY_PROFILE)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(profile ? { ...EMPTY_PROFILE, ...profile } : EMPTY_PROFILE)
    }
  }, [open, profile])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      pushToast('Ponle un nombre al perfil', 'error')
      return
    }
    setSaving(true)
    try {
      if (profile) {
        await api.updateProfile(profile.id, form)
        pushToast('Perfil actualizado', 'success')
      } else {
        const created = await api.createProfile(form)
        setActiveId(created.id)
        pushToast('Perfil creado', 'success')
      }
      await refreshProfiles()
      onClose()
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={profile ? 'Editar perfil' : 'Nuevo perfil'}
      subtitle="Define tus tiempos por defecto y el comportamiento de las sesiones."
      wide
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="profile-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : profile ? 'Guardar cambios' : 'Crear perfil'}
          </button>
        </>
      }
    >
      <form id="profile-form" className="form-stack" onSubmit={submit}>
        <div className="form-grid">
          <TextField
            label="Nombre del perfil"
            value={form.name}
            onChange={(value) => update('name', value)}
            placeholder="Ej. Trabajo, Estudio, Personal"
            maxLength={40}
            autoFocus
          />
          <ColorPicker value={form.color} onChange={(value) => update('color', value)} />
        </div>

        <div className="form-grid form-grid--four">
          <NumberField
            label="Enfoque"
            value={form.workMinutes}
            onChange={(value) => update('workMinutes', value)}
            min={1}
            max={180}
          />
          <NumberField
            label="Descanso corto"
            value={form.shortBreakMinutes}
            onChange={(value) => update('shortBreakMinutes', value)}
            min={1}
            max={60}
          />
          <NumberField
            label="Descanso largo"
            value={form.longBreakMinutes}
            onChange={(value) => update('longBreakMinutes', value)}
            min={1}
            max={120}
          />
          <NumberField
            label="Enfoques por ciclo"
            value={form.longBreakInterval}
            onChange={(value) => update('longBreakInterval', value)}
            min={2}
            max={12}
            suffix="ses."
            hint="Descanso largo al completar el ciclo."
          />
        </div>

        <div className="toggle-stack">
          <Toggle
            label="Iniciar descansos automáticamente"
            description="Al terminar un enfoque, el descanso empieza solo."
            checked={form.autoStartBreaks}
            onChange={(value) => update('autoStartBreaks', value)}
          />
          <Toggle
            label="Iniciar enfoque automáticamente"
            description="Al terminar un descanso, vuelve el enfoque sin pulsar nada."
            checked={form.autoStartFocus}
            onChange={(value) => update('autoStartFocus', value)}
          />
          <Toggle
            label="Sonido al terminar"
            description="Reproduce un aviso suave al finalizar cada sesión."
            checked={form.soundEnabled}
            onChange={(value) => update('soundEnabled', value)}
          />
        </div>
      </form>
    </Modal>
  )
}

function PresetFormModal({ open, preset, profileId, onClose }) {
  const { refreshPresets, pushToast } = useApp()
  const [form, setForm] = useState(EMPTY_PRESET)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(preset ? { ...EMPTY_PRESET, ...preset } : EMPTY_PRESET)
    }
  }, [open, preset])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  async function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      pushToast('Ponle un nombre al perfil de sesión', 'error')
      return
    }
    setSaving(true)
    try {
      if (preset) {
        await api.updatePreset(preset.id, form)
        pushToast('Perfil de sesión actualizado', 'success')
      } else {
        await api.createPreset({ ...form, profileId })
        pushToast('Perfil de sesión creado', 'success')
      }
      await refreshPresets()
      onClose()
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={preset ? 'Editar perfil de sesión' : 'Nuevo perfil de sesión'}
      subtitle="Una combinación de tiempos lista para usar en el temporizador."
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="preset-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : preset ? 'Guardar cambios' : 'Crear perfil'}
          </button>
        </>
      }
    >
      <form id="preset-form" className="form-stack" onSubmit={submit}>
        <TextField
          label="Nombre del perfil de sesión"
          value={form.name}
          onChange={(value) => update('name', value)}
          placeholder="Ej. Estudio intenso"
          maxLength={40}
          autoFocus
        />
        <div className="form-grid form-grid--four">
          <NumberField
            label="Enfoque"
            value={form.workMinutes}
            onChange={(value) => update('workMinutes', value)}
            min={1}
            max={180}
          />
          <NumberField
            label="Descanso corto"
            value={form.shortBreakMinutes}
            onChange={(value) => update('shortBreakMinutes', value)}
            min={1}
            max={60}
          />
          <NumberField
            label="Descanso largo"
            value={form.longBreakMinutes}
            onChange={(value) => update('longBreakMinutes', value)}
            min={1}
            max={120}
          />
          <NumberField
            label="Enfoques por ciclo"
            value={form.longBreakInterval}
            onChange={(value) => update('longBreakInterval', value)}
            min={2}
            max={12}
            suffix="ses."
          />
        </div>
      </form>
    </Modal>
  )
}

export default function ProfilesPage() {
  const {
    profiles,
    activeProfile,
    activeId,
    setActiveId,
    presets,
    refreshProfiles,
    refreshPresets,
    pushToast,
    navigate,
  } = useApp()

  const [profileModal, setProfileModal] = useState({ open: false, profile: null })
  const [presetModal, setPresetModal] = useState({ open: false, preset: null })
  const [deleteProfile, setDeleteProfile] = useState(null)
  const [deletePreset, setDeletePreset] = useState(null)
  const [busy, setBusy] = useState(false)
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  )

  let appliedPresetId = null
  try {
    appliedPresetId = JSON.parse(
      window.localStorage.getItem(`pomodoro.preset.${activeProfile.id}`)
    )
  } catch {
    appliedPresetId = null
  }

  async function confirmDeleteProfile() {
    if (!deleteProfile) return
    setBusy(true)
    try {
      const remaining = profiles.filter((profile) => profile.id !== deleteProfile.id)
      await api.deleteProfile(deleteProfile.id)
      if (deleteProfile.id === activeId && remaining.length > 0) {
        setActiveId(remaining[0].id)
      }
      await refreshProfiles()
      pushToast('Perfil eliminado', 'success')
      setDeleteProfile(null)
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  async function confirmDeletePreset() {
    if (!deletePreset) return
    setBusy(true)
    try {
      await api.deletePreset(deletePreset.id)
      if (appliedPresetId === deletePreset.id) {
        window.localStorage.removeItem(`pomodoro.preset.${activeProfile.id}`)
      }
      await refreshPresets()
      pushToast('Perfil de sesión eliminado', 'success')
      setDeletePreset(null)
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  function applyPreset(preset) {
    window.localStorage.setItem(
      `pomodoro.preset.${activeProfile.id}`,
      JSON.stringify(preset.id)
    )
    pushToast(`Perfil "${preset.name}" listo para usar`, 'success')
    navigate('timer')
  }

  async function toggleSound(next) {
    try {
      await api.updateProfile(activeProfile.id, { soundEnabled: next })
      await refreshProfiles()
      pushToast(next ? 'Sonido activado' : 'Sonido desactivado', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  async function requestNotifications() {
    if (!('Notification' in window)) {
      pushToast('Este navegador no admite notificaciones', 'error')
      return
    }
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') pushToast('Notificaciones activadas', 'success')
      else if (result === 'denied') pushToast('Notificaciones bloqueadas por el navegador', 'info')
    } catch {
      pushToast('No se pudieron activar las notificaciones', 'error')
    }
  }

  const notificationsLabel =
    permission === 'granted'
      ? 'Activadas'
      : permission === 'denied'
        ? 'Bloqueadas'
        : permission === 'unsupported'
          ? 'No compatibles'
          : 'Activar'

  return (
    <div className="page">
      <PageHeader
        eyebrow="Personalización"
        title="Perfiles"
        subtitle="Separa tus contextos y guarda combinaciones de tiempo a tu medida."
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setProfileModal({ open: true, profile: null })}
          >
            <Plus size={17} /> Nuevo perfil
          </button>
        }
      />

      <div className="profile-grid">
        {profiles.map((profile) => (
          <article
            key={profile.id}
            className={`profile-tile ${profile.id === activeId ? 'is-active' : ''}`}
            style={{ '--profile-color': profile.color }}
          >
            <div className="profile-tile-top">
              <span
                className="avatar avatar--large"
                style={{
                  color: profile.color,
                  background: `${profile.color}1f`,
                  borderColor: `${profile.color}55`,
                }}
              >
                {initials(profile.name)}
              </span>
              {profile.id === activeId && (
                <span className="badge badge--accent">
                  <Check size={12} /> Activo
                </span>
              )}
            </div>
            <h3>{profile.name}</h3>
            <p className="profile-timing">
              {profile.workMinutes} min enfoque · {profile.shortBreakMinutes} min descanso
            </p>
            <div className="profile-meta">
              <span>Ciclo de {profile.longBreakInterval} enfoques</span>
              <span>Descanso largo de {profile.longBreakMinutes} min</span>
            </div>
            <div className="profile-tile-actions">
              {profile.id !== activeId ? (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setActiveId(profile.id)
                    pushToast(`Perfil "${profile.name}" activado`, 'success')
                  }}
                >
                  <Play size={14} /> Activar
                </button>
              ) : (
                <span className="profile-active-note">En uso en el temporizador</span>
              )}
              <span className="profile-actions-spacer" />
              <button
                className="icon-button"
                onClick={() => setProfileModal({ open: true, profile })}
                aria-label={`Editar ${profile.name}`}
                title="Editar perfil"
              >
                <Pencil size={16} />
              </button>
              <button
                className="icon-button icon-button--danger"
                onClick={() => setDeleteProfile(profile)}
                aria-label={`Eliminar ${profile.name}`}
                title={
                  profiles.length === 1
                    ? 'No puedes eliminar el único perfil'
                    : 'Eliminar perfil'
                }
                disabled={profiles.length === 1}
              >
                <Trash size={16} />
              </button>
            </div>
          </article>
        ))}

        <button
          className="profile-tile profile-tile--add"
          onClick={() => setProfileModal({ open: true, profile: null })}
        >
          <span className="add-circle">
            <Plus size={22} />
          </span>
          <strong>Añadir perfil</strong>
          <span>Otro contexto, otros tiempos</span>
        </button>
      </div>

      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Atajos de tiempo</span>
            <h2>Perfiles de sesión de {activeProfile.name}</h2>
            <p>
              Combinaciones de enfoque y descanso listas para lanzar desde el temporizador.
            </p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setPresetModal({ open: true, preset: null })}
          >
            <Plus size={16} /> Nuevo perfil de sesión
          </button>
        </div>

        {presets.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Sparkles}
              title="Sin perfiles de sesión"
              action={
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setPresetModal({ open: true, preset: null })}
                >
                  Crear el primero
                </button>
              }
            >
              Guarda tus combinaciones favoritas, por ejemplo 50 minutos de enfoque con 10 de
              descanso.
            </EmptyState>
          </div>
        ) : (
          <div className="preset-grid">
            {presets.map((preset) => {
              const isApplied = preset.id === appliedPresetId
              return (
                <article key={preset.id} className={`preset-tile ${isApplied ? 'is-applied' : ''}`}>
                  <div className="preset-head">
                    <span className="icon-chip" style={{ color: activeProfile.color }}>
                      <Sparkles size={17} />
                    </span>
                    {isApplied && (
                      <span className="badge badge--accent">
                        <Check size={12} /> En uso
                      </span>
                    )}
                  </div>
                  <h3>{preset.name}</h3>
                  <div className="preset-times">
                    <div>
                      <strong>{preset.workMinutes}</strong>
                      <span>enfoque</span>
                    </div>
                    <div>
                      <strong>{preset.shortBreakMinutes}</strong>
                      <span>descanso</span>
                    </div>
                    <div>
                      <strong>{preset.longBreakMinutes}</strong>
                      <span>largo</span>
                    </div>
                  </div>
                  <p className="preset-cycle">
                    Descanso largo cada {preset.longBreakInterval} enfoques.
                  </p>
                  <div className="preset-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => applyPreset(preset)}
                    >
                      <Play size={14} /> Usar en temporizador
                    </button>
                    <span className="profile-actions-spacer" />
                    <button
                      className="icon-button"
                      onClick={() => setPresetModal({ open: true, preset })}
                      aria-label={`Editar ${preset.name}`}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      onClick={() => setDeletePreset(preset)}
                      aria-label={`Eliminar ${preset.name}`}
                      title="Eliminar"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="section-block">
        <div className="section-head">
          <div>
            <span className="eyebrow">Ajustes</span>
            <h2>Preferencias de {activeProfile.name}</h2>
            <p>Sonido, notificaciones y dónde viven tus datos.</p>
          </div>
        </div>

        <div className="card settings-card">
          <div className="settings-row">
            <span className="settings-icon">
              {activeProfile.soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
            </span>
            <div className="settings-text">
              <strong>Sonido al terminar una sesión</strong>
              <p>Un chime suave cuando el temporizador llega a cero.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={activeProfile.soundEnabled}
              aria-label="Sonido al terminar"
              className={`toggle ${activeProfile.soundEnabled ? 'is-on' : ''}`}
              onClick={() => toggleSound(!activeProfile.soundEnabled)}
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          <div className="settings-row">
            <span className="settings-icon">
              <Bell size={19} />
            </span>
            <div className="settings-text">
              <strong>Notificaciones del navegador</strong>
              <p>
                Avisos aunque estés en otra pestaña. En red local algunos navegadores requieren
                HTTPS.
              </p>
            </div>
            <button
              className={`btn btn-sm ${
                permission === 'granted' || permission === 'denied' || permission === 'unsupported'
                  ? 'btn-ghost'
                  : 'btn-secondary'
              }`}
              onClick={requestNotifications}
              disabled={
                permission === 'granted' ||
                permission === 'denied' ||
                permission === 'unsupported'
              }
            >
              {notificationsLabel}
            </button>
          </div>

          <div className="settings-row">
            <span className="settings-icon">
              <Sliders size={19} />
            </span>
            <div className="settings-text">
              <strong>Ajustes de tiempo</strong>
              <p>
                Edita el perfil para cambiar los minutos de enfoque, descanso y duración del ciclo.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setProfileModal({ open: true, profile: activeProfile })}
            >
              <Pencil size={14} /> Editar
            </button>
          </div>

          <div className="settings-row">
            <span className="settings-icon">
              <Info size={19} />
            </span>
            <div className="settings-text">
              <strong>Tus datos</strong>
              <p>
                Todo se guarda en SQLite dentro del volumen <code>./data</code> del contenedor.
                Copia esa carpeta para hacer una copia de seguridad.
              </p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('dashboard')}>
              Ver resumen <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      <ProfileFormModal
        open={profileModal.open}
        profile={profileModal.profile}
        onClose={() => setProfileModal({ open: false, profile: null })}
      />
      <PresetFormModal
        open={presetModal.open}
        preset={presetModal.preset}
        profileId={activeProfile.id}
        onClose={() => setPresetModal({ open: false, preset: null })}
      />

      <ConfirmDialog
        open={Boolean(deleteProfile)}
        title="Eliminar perfil"
        confirmLabel="Eliminar perfil"
        busy={busy}
        onClose={() => setDeleteProfile(null)}
        onConfirm={confirmDeleteProfile}
      >
        {deleteProfile && (
          <p>
            Se eliminará el perfil <strong>{deleteProfile.name}</strong>, sus perfiles de sesión y
            todo su historial de tiempo. Esta acción no se puede deshacer.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deletePreset)}
        title="Eliminar perfil de sesión"
        confirmLabel="Eliminar"
        busy={busy}
        onClose={() => setDeletePreset(null)}
        onConfirm={confirmDeletePreset}
      >
        {deletePreset && (
          <p>
            ¿Eliminar <strong>{deletePreset.name}</strong>? Las sesiones ya registradas se
            conservarán.
          </p>
        )}
      </ConfirmDialog>
    </div>
  )
}
