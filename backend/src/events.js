import { db } from './db.js'
import { canAccessChild, findChild } from './links.js'

// Errors carry an HTTP status so the router can answer with the right code.
export class EventError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function parseDate(value) {
  if (!DATE_RE.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  // new Date() rolls 2026-02-31 over to March, so compare back to catch impossible dates.
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date
}

// FR-M3-02: the Monday–Sunday range that contains the given date (default: today).
// UTC maths on date-only strings keeps the result independent of the server's time zone.
export function weekRange(value = new Date().toISOString().slice(0, 10)) {
  const date = parseDate(value)
  if (!date) throw new EventError(400, 'Week must be a valid date (YYYY-MM-DD)')
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  const monday = new Date(date.getTime() - daysSinceMonday * 86_400_000)
  const sunday = new Date(monday.getTime() + 6 * 86_400_000)
  return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) }
}

export function getEvent(id) {
  return db.prepare('SELECT * FROM events WHERE id = ?').get(id)
}

// FR-M3-01, FR-M3-05: validate an event before it is stored or changed.
function validate({ title, event_date, start_time, end_time }) {
  if (!title || !String(title).trim() || !event_date || !start_time || !end_time) {
    throw new EventError(400, 'Title, date, start time and end time are required')
  }
  if (!parseDate(event_date)) throw new EventError(400, 'Date must be a valid date (YYYY-MM-DD)')
  if (!TIME_RE.test(start_time) || !TIME_RE.test(end_time)) {
    throw new EventError(400, 'Times must be in HH:MM format')
  }
  // Zero-padded HH:MM strings compare correctly as text.
  if (end_time <= start_time) throw new EventError(400, 'End time must be after start time')
}

// FR-M3-01: parent or linked specialist adds an event for the child.
export function addEvent(childId, createdBy, body) {
  validate(body)
  const { title, event_date, start_time, end_time } = body
  const result = db
    .prepare(
      `INSERT INTO events (child_id, created_by, title, event_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(childId, createdBy, String(title).trim(), event_date, start_time, end_time)
  return getEvent(result.lastInsertRowid)
}

// FR-M3-02, FR-M3-03, FR-M3-04: the child's events for one Monday–Sunday week.
export function listEventsForWeek(childId, week) {
  const { start, end } = weekRange(week)
  const events = db
    .prepare(
      `SELECT * FROM events
       WHERE child_id = ? AND event_date BETWEEN ? AND ?
       ORDER BY event_date, start_time, id`,
    )
    .all(childId, start, end)
  return { week_start: start, week_end: end, events }
}

// FR-M3-06: only the creator edits or deletes an event, and only while they
// still have access to the child (an unlinked specialist loses that right).
function loadOwnedEvent(eventId, user) {
  const event = getEvent(eventId)
  if (!event) throw new EventError(404, 'Event not found')
  if (event.created_by !== user.id || !canAccessChild(user, findChild(event.child_id))) {
    throw new EventError(403, 'Forbidden')
  }
  return event
}

export function updateEvent(eventId, user, body) {
  loadOwnedEvent(eventId, user)
  validate(body)
  const { title, event_date, start_time, end_time } = body
  db.prepare(
    'UPDATE events SET title = ?, event_date = ?, start_time = ?, end_time = ? WHERE id = ?',
  ).run(String(title).trim(), event_date, start_time, end_time, eventId)
  return getEvent(eventId)
}

export function deleteEvent(eventId, user) {
  loadOwnedEvent(eventId, user)
  db.prepare('DELETE FROM events WHERE id = ?').run(eventId)
}
