import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api.js'
import EventForm from './EventForm.jsx'

// Dates are handled as 'YYYY-MM-DD' strings and built from local parts, so the
// browser's time zone never shifts a day.
function toISO(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function parseISO(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function addDays(value, days) {
  const date = parseISO(value)
  date.setDate(date.getDate() + days)
  return toISO(date)
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatDate(value) {
  const [year, month, day] = value.split('-')
  return `${day}.${month}.${year}`
}

// The weekly view of one child's events (FR-M3-02, FR-M3-03). `canEdit` is true for the
// parent and linked specialists (add form, FR-M3-01); the child sees it read-only (FR-M3-04).
// Delete is offered only on the events the logged-in user created (FR-M3-06).
function WeeklySchedule({ childId, token, userId, canEdit = false }) {
  // Any date inside the shown week; the server turns it into Monday–Sunday.
  const [anchor, setAnchor] = useState(() => toISO(new Date()))
  const [week, setWeek] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    return apiFetch(`/api/children/${childId}/events?week=${anchor}`, { token })
      .then((data) => {
        setWeek(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
  }, [childId, token, anchor])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(eventId) {
    try {
      await apiFetch(`/api/events/${eventId}`, { token, method: 'DELETE' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <p className="error">Could not load the schedule: {error}</p>
  if (!week) return <p>Loading schedule…</p>

  const days = DAY_NAMES.map((name, index) => {
    const date = addDays(week.week_start, index)
    return { name, date, events: week.events.filter((e) => e.event_date === date) }
  })

  return (
    <div data-testid="weekly-schedule">
      <div className="week-nav">
        <button type="button" className="link-button" onClick={() => setAnchor(addDays(week.week_start, -7))}>
          Previous week
        </button>
        <strong data-testid="week-label">
          {formatDate(week.week_start)} – {formatDate(week.week_end)}
        </strong>
        <button type="button" className="link-button" onClick={() => setAnchor(addDays(week.week_start, 7))}>
          Next week
        </button>
      </div>

      <ul className="week-grid plain-list">
        {days.map((day) => (
          <li key={day.date} className="week-day" data-testid={`day-${day.date}`}>
            <h5>
              {day.name} <span className="muted small">{day.date.slice(8)}.{day.date.slice(5, 7)}</span>
            </h5>
            {day.events.length === 0 && <p className="muted small">No events</p>}
            {day.events.map((ev) => (
              <div key={ev.id} className="event" data-testid="event">
                <span className="muted small">
                  {ev.start_time}–{ev.end_time}
                </span>
                <span>{ev.title}</span>
                {canEdit && ev.created_by === userId && (
                  <button type="button" className="link-button" onClick={() => handleDelete(ev.id)}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </li>
        ))}
      </ul>

      {canEdit && (
        <EventForm
          childId={childId}
          token={token}
          onAdded={(created) => {
            // Jump to the week of the new event so it is visible right away.
            if (created.event_date === anchor) return load()
            setAnchor(created.event_date)
          }}
        />
      )}
    </div>
  )
}

export default WeeklySchedule
