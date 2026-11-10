import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api.js'

// Shows one child's tasks (FR-M4-04, FR-M4-07). When `canComplete` is true
// (the child viewing their own tasks), each pending task gets a "Mark done"
// button (FR-M4-05).
function TaskList({ childId, token, canComplete = false }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    return apiFetch(`/api/children/${childId}/tasks`, { token })
      .then((data) => {
        setTasks(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [childId, token])

  useEffect(() => {
    load()
  }, [load])

  async function handleDone(taskId) {
    try {
      await apiFetch(`/api/tasks/${taskId}/status`, { token, method: 'PATCH' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <p>Loading tasks…</p>
  if (error) return <p className="error">Could not load tasks: {error}</p>
  if (tasks.length === 0) return <p>No tasks yet.</p>

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li key={task.id} className="task-card">
          <div className="task-card-header">
            <h2>{task.title}</h2>
            <span className={`status status-${task.status}`}>{task.status}</span>
          </div>
          {task.description && <p className="task-description">{task.description}</p>}
          <p className="task-meta">
            {task.development_area} · due {task.due_date}
          </p>
          {canComplete && task.status === 'pending' && (
            <button type="button" className="link-button" onClick={() => handleDone(task.id)}>
              Mark done
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

export default TaskList
