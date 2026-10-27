import { useState } from 'react'
import { api } from '../api'
import { useApp } from '../context'
import { EmptyState, PageHeader } from '../components/Layout'
import { ConfirmDialog } from '../components/Form'
import { Check, ListChecks, Pencil, Play, Plus, Trash } from '../components/Icons'

export default function TasksPage() {
  const { activeProfile, tasks, tasksLoading, refreshTasks, pushToast, focusTask } = useApp()
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const pending = tasks.filter((task) => !task.completed)
  const completed = tasks.filter((task) => task.completed)

  async function addTask(event) {
    event.preventDefault()
    const value = title.trim()
    if (!value || adding) return
    setAdding(true)
    try {
      await api.createTask({ profileId: activeProfile.id, title: value })
      setTitle('')
      await refreshTasks()
      pushToast('Tarea agregada', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setAdding(false)
    }
  }

  function startEdit(task) {
    setEditingId(task.id)
    setEditingTitle(task.title)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingTitle('')
  }

  async function saveEdit(event) {
    event.preventDefault()
    const value = editingTitle.trim()
    if (!value || !editingId || savingEdit) return
    setSavingEdit(true)
    try {
      await api.updateTask(editingId, { title: value })
      await refreshTasks()
      setEditingId(null)
      setEditingTitle('')
      pushToast('Tarea actualizada', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  async function toggleTask(task) {
    try {
      await api.updateTask(task.id, { completed: !task.completed })
      await refreshTasks()
      pushToast(task.completed ? 'Tarea reabierta' : 'Tarea completada', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await api.deleteTask(pendingDelete.id)
      setPendingDelete(null)
      await refreshTasks()
      pushToast('Tarea eliminada', 'success')
    } catch (error) {
      pushToast(error.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  function renderTask(task) {
    const isEditing = editingId === task.id

    return (
      <li key={task.id} className={`task-row ${task.completed ? 'is-done' : ''}`}>
        <button
          type="button"
          className={`task-check ${task.completed ? 'is-checked' : ''}`}
          onClick={() => toggleTask(task)}
          aria-label={task.completed ? `Reabrir ${task.title}` : `Completar ${task.title}`}
          title={task.completed ? 'Reabrir tarea' : 'Marcar como completada'}
        >
          {task.completed && <Check size={14} />}
        </button>

        {isEditing ? (
          <form className="task-edit" onSubmit={saveEdit}>
            <input
              className="input"
              type="text"
              value={editingTitle}
              onChange={(event) => setEditingTitle(event.target.value)}
              maxLength={120}
              autoFocus
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={savingEdit}>
              {savingEdit ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={cancelEdit}
              disabled={savingEdit}
            >
              Cancelar
            </button>
          </form>
        ) : (
          <>
            <div className="task-main">
              <strong>{task.title}</strong>
              <span>{task.completed ? 'Completada' : 'Pendiente'}</span>
            </div>

            {!task.completed && (
              <button
                type="button"
                className="icon-action"
                onClick={() => focusTask(task)}
                title="Preparar sesión con esta tarea"
                aria-label={`Preparar sesión con ${task.title}`}
              >
                <Play size={16} />
              </button>
            )}
            <button
              type="button"
              className="icon-action"
              onClick={() => startEdit(task)}
              title="Editar tarea"
              aria-label={`Editar ${task.title}`}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="icon-action icon-action--danger"
              onClick={() => setPendingDelete(task)}
              title="Eliminar tarea"
              aria-label={`Eliminar ${task.title}`}
            >
              <Trash size={16} />
            </button>
          </>
        )}
      </li>
    )
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Planificación"
        title="Tareas"
        subtitle="Anota lo que quieres completar y elige una tarea al iniciar una sesión de enfoque."
        actions={
          <span className="task-count">
            <strong>{pending.length}</strong> pendiente{pending.length === 1 ? '' : 's'}
            {completed.length > 0 && (
              <>
                {' · '}
                <strong>{completed.length}</strong> completada{completed.length === 1 ? '' : 's'}
              </>
            )}
          </span>
        }
      />

      <section className="card">
        <form className="task-add" onSubmit={addTask}>
          <input
            className="input"
            type="text"
            placeholder="¿Qué tarea o actividad quieres trabajar?"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
          />
          <button className="btn btn-primary" type="submit" disabled={adding || !title.trim()}>
            <Plus size={16} />
            {adding ? 'Agregando…' : 'Agregar'}
          </button>
        </form>

        {tasksLoading ? (
          <p className="hint">Cargando tareas…</p>
        ) : tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="Aún no hay tareas">
            Agrega tu primera actividad para tenerla lista cuando empieces a enfocarte.
          </EmptyState>
        ) : (
          <div className="task-sections">
            {pending.length > 0 && (
              <div className="task-section">
                <div className="task-section-head">
                  <span>Pendientes</span>
                  <span>{pending.length}</span>
                </div>
                <ul className="task-list">{pending.map(renderTask)}</ul>
              </div>
            )}

            {completed.length > 0 && (
              <div className="task-section">
                <div className="task-section-head">
                  <span>Completadas</span>
                  <span>{completed.length}</span>
                </div>
                <ul className="task-list">{completed.map(renderTask)}</ul>
              </div>
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar tarea"
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        busy={deleting}
      >
        ¿Eliminar «{pendingDelete?.title}»? Las sesiones ya registradas conservarán su etiqueta.
      </ConfirmDialog>
    </div>
  )
}
