import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(`${API_URL}/api/tasks`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
        return res.json()
      })
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
  }, [])

  return (
    <main className="page">
      <h1>ChildConnect</h1>
      <p className="subtitle">Tasks</p>

      {loading && <p>Loading tasks…</p>}
      {error && <p className="error">Could not load tasks: {error}</p>}
      {!loading && !error && tasks.length === 0 && <p>No tasks yet.</p>}

      {!loading && !error && tasks.length > 0 && (
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
      )}
    </main>
  )
}

export default App
