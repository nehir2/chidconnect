// M7 – Weekly statistics.
// FR-M7-04: the numbers are computed here, by plain application code — never by the AI module.

const DAY_MS = 24 * 60 * 60 * 1000

function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

const toIso = (date) => date.toISOString().slice(0, 10)

// The Monday–Sunday week that contains `day` (a "YYYY-MM-DD" string). Returns null for a bad date.
export function weekRange(day) {
  const date = parseDate(day)
  if (!date) return null
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  const monday = new Date(date.getTime() - daysSinceMonday * DAY_MS)
  const sunday = new Date(monday.getTime() + 6 * DAY_MS)
  return { start: toIso(monday), end: toIso(sunday) }
}

function rate(done, due) {
  return { done, due, rate: Math.round((done / due) * 100) }
}

// Pure function, unit tested (FR-M7-01, FR-M7-02, FR-M7-03).
// Rate = completed tasks ÷ tasks due in the week, in total and for each development area.
// When no task is due in the week, `total` is null and `byArea` is empty: the UI then
// shows "No tasks this week" instead of a rate.
export function computeWeeklyStats(tasks, day) {
  const week = weekRange(day)
  if (!week) throw new RangeError('Invalid date, expected YYYY-MM-DD')

  const due = tasks.filter((t) => t.due_date >= week.start && t.due_date <= week.end)
  if (due.length === 0) return { week, total: null, byArea: [] }

  const areas = new Map()
  for (const task of due) {
    const counts = areas.get(task.development_area) || { done: 0, due: 0 }
    counts.due += 1
    if (task.status === 'done') counts.done += 1
    areas.set(task.development_area, counts)
  }

  const done = due.filter((t) => t.status === 'done').length
  const byArea = [...areas.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([area, c]) => ({ area, ...rate(c.done, c.due) }))

  return { week, total: rate(done, due.length), byArea }
}
