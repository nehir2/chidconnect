import { useEffect, useState } from 'react'
import { apiFetch } from '../api.js'

// The assigner's own status list: the tasks this parent/specialist assigned,
// across every child, with status (FR-M4-06).
function AssignedTasks({ token }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/me/assigned-tasks', { token })
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

  if (loading) return <p>Loading…</p>
  if (error) return <p className="error">{error}</p>
  if (tasks.length === 0) return <p>You haven't assigned any tasks yet.</p>

  return (
    <ul className="plain-list" data-testid="assigned-tasks">
      {tasks.map((task) => (
        <li key={task.id} className="list-row panel">
          <div>
            <strong>{task.title}</strong> <span className="muted">· for {task.child_name}</span>
          </div>
          <span className={`status status-${task.status}`}>{task.status}</span>
        </li>
      ))}
    </ul>
  )
}

export default AssignedTasks
