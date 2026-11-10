import { useState } from 'react'
import { apiFetch } from '../api.js'

const AREAS = ['Language', 'Motor', 'Social', 'Cognitive', 'Self-care']

// Parent or linked specialist assigns a task to a child (FR-M4-01, FR-M4-02, FR-M4-03).
function AssignTaskForm({ childId, token, onAssigned }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [area, setArea] = useState(AREAS[0])
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await apiFetch(`/api/children/${childId}/tasks`, {
        token,
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          development_area: area,
          due_date: dueDate,
        }),
      })
      setTitle('')
      setDescription('')
      setDueDate('')
      await onAssigned?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <h4>Assign a task</h4>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Development area
        <select value={area} onChange={(e) => setArea(e.target.value)}>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>
      <label>
        Due date
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={saving}>
        {saving ? 'Assigning…' : 'Assign task'}
      </button>
    </form>
  )
}

export default AssignTaskForm
