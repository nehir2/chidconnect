import { Router } from 'express'
import { requireAuth, requireRole } from '../auth.js'
import {
  EventError,
  addEvent,
  deleteEvent,
  listEventsForWeek,
  updateEvent,
} from '../events.js'
import { requireLinkedAccess } from '../links.js'

export const eventsRouter = Router()

function handle(fn) {
  return (req, res) => {
    try {
      fn(req, res)
    } catch (err) {
      if (err instanceof EventError) return res.status(err.status).json({ error: err.message })
      throw err
    }
  }
}

// GET /api/children/:id/events?week=YYYY-MM-DD  →  the week's events; parent, linked
// specialist or the child (read-only) (FR-M3-02, FR-M3-03, FR-M3-04)
eventsRouter.get(
  '/children/:id/events',
  requireAuth,
  requireLinkedAccess,
  handle((req, res) => {
    res.json(listEventsForWeek(req.child.id, req.query.week))
  }),
)

// POST /api/children/:id/events  { title, event_date, start_time, end_time }  (FR-M3-01, FR-M3-05)
eventsRouter.post(
  '/children/:id/events',
  requireAuth,
  requireRole('parent', 'specialist'),
  requireLinkedAccess,
  handle((req, res) => {
    res.status(201).json(addEvent(req.child.id, req.user.id, req.body || {}))
  }),
)

// PUT /api/events/:id  →  the creator edits their event (FR-M3-06)
eventsRouter.put(
  '/events/:id',
  requireAuth,
  requireRole('parent', 'specialist'),
  handle((req, res) => {
    res.json(updateEvent(Number(req.params.id), req.user, req.body || {}))
  }),
)

// DELETE /api/events/:id  →  the creator deletes their event (FR-M3-06)
eventsRouter.delete(
  '/events/:id',
  requireAuth,
  requireRole('parent', 'specialist'),
  handle((req, res) => {
    deleteEvent(Number(req.params.id), req.user)
    res.status(204).end()
  }),
)
