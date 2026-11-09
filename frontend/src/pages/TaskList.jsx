import { useEffect, useState } from 'react'
import { apiFetch } from '../api.js'

function TaskList({ token }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    apiFetch('/api/tasks', { token })
      .then((data) => {
        if (!cancelled) setTasks(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

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
        </li>
      ))}
    </ul>
  )
}

export default TaskList
