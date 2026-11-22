import { useState } from 'react'
import { apiFetch } from '../api.js'

// Parent or linked specialist adds an event to the child's schedule (FR-M3-01, FR-M3-05).
// The server validates everything again; the form only shows its error message.
function EventForm({ childId, token, onAdded }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const created = await apiFetch(`/api/children/${childId}/events`, {
        token,
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          event_date: date,
          start_time: start,
          end_time: end,
        }),
      })
      setTitle('')
      setStart('')
      setEnd('')
      await onAdded?.(created)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit} data-testid="event-form">
      <h4>Add an event</h4>
      <label>
        Event title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Event date
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label>
        Start time
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} required />
      </label>
      <label>
        End time
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} required />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={saving}>
        {saving ? 'Adding…' : 'Add event'}
      </button>
    </form>
  )
}

export default EventForm
