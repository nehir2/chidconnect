import { Router } from 'express'
import { requireAuth, requireRole } from '../auth.js'
import { requireLinkedAccess } from '../links.js'
import { TaskError, assignTask, listTasksAssignedBy, listTasksForChild, markTaskDone } from '../tasks.js'

export const tasksRouter = Router()

function handle(fn) {
  return (req, res) => {
    try {
      fn(req, res)
    } catch (err) {
      if (err instanceof TaskError) return res.status(err.status).json({ error: err.message })
      throw err
    }
  }
}

// GET /api/me/assigned-tasks  →  the tasks the logged-in parent/specialist assigned (FR-M4-06)
tasksRouter.get('/me/assigned-tasks', requireAuth, requireRole('parent', 'specialist'), (req, res) => {
  res.json(listTasksAssignedBy(req.user.id))
})

// GET /api/children/:id/tasks  →  parent, child or linked specialist (FR-M4-04, FR-M4-07)
tasksRouter.get('/children/:id/tasks', requireAuth, requireLinkedAccess, (req, res) => {
  res.json(listTasksForChild(req.child.id))
})

// POST /api/children/:id/tasks  { title, description, development_area, due_date }  (FR-M4-01, 02, 03)
tasksRouter.post(
  '/children/:id/tasks',
  requireAuth,
  requireRole('parent', 'specialist'),
  requireLinkedAccess,
  handle((req, res) => {
    const task = assignTask(req.child.id, req.user.id, req.body || {})
    res.status(201).json(task)
  }),
)

// PATCH /api/tasks/:id/status  →  the task's own child marks it done (FR-M4-05)
tasksRouter.patch(
  '/tasks/:id/status',
  requireAuth,
  requireRole('child'),
  handle((req, res) => {
    const task = markTaskDone(Number(req.params.id), req.user.id)
    res.json(task)
  }),
)
