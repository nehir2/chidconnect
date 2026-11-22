import { useEffect, useState } from 'react'
import { apiFetch } from '../api.js'

const DAY_MS = 24 * 60 * 60 * 1000

const todayIso = () => new Date().toISOString().slice(0, 10)

function shiftWeek(day, weeks) {
  const date = new Date(`${day}T00:00:00Z`)
  return new Date(date.getTime() + weeks * 7 * DAY_MS).toISOString().slice(0, 10)
}

function formatDay(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

function RateBar({ label, done, due, rate }) {
  return (
    <div className="rate-row">
      <div className="rate-label">
        <span>{label}</span>
        <span className="muted small">
          {done}/{due} · <strong>{rate}%</strong>
        </span>
      </div>
      <div className="rate-track" role="presentation">
        <div className="rate-fill" style={{ width: `${rate}%` }} />
      </div>
    </div>
  )
}

// M7: weekly completion rate for one child, in total and per development area.
// Shown to the parent and linked specialists only (FR-M7-05).
function WeeklyStatsCard({ child, token }) {
  const [day, setDay] = useState(todayIso)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiFetch(`/api/children/${child.id}/stats?week=${day}`, { token })
      .then((data) => {
        if (!cancelled) {
          setStats(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [child.id, token, day])

  return (
    <div className="panel" data-testid="weekly-stats">
      <div className="stats-header">
        <h3>Weekly progress of {child.name}</h3>
        <div className="week-picker">
          <button type="button" className="link-button" aria-label="Previous week" onClick={() => setDay((d) => shiftWeek(d, -1))}>
            ‹
          </button>
          <span className="small" data-testid="week-label">
            {stats ? `${formatDay(stats.week.start)} – ${formatDay(stats.week.end)}` : '…'}
          </span>
          <button type="button" className="link-button" aria-label="Next week" onClick={() => setDay((d) => shiftWeek(d, 1))}>
            ›
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {stats && !stats.total && <p className="muted">No tasks this week</p>}
      {stats && stats.total && (
        <>
          <RateBar label="All tasks" {...stats.total} />
          <div className="rate-areas">
            {stats.byArea.map((a) => (
              <RateBar key={a.area} label={a.area} done={a.done} due={a.due} rate={a.rate} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default WeeklyStatsCard
