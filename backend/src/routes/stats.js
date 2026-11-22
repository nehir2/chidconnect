import { Router } from 'express'
import { requireAuth, requireRole } from '../auth.js'
import { requireLinkedAccess } from '../links.js'
import { computeWeeklyStats } from '../stats.js'
import { listTasksForChild } from '../tasks.js'

export const statsRouter = Router()

const today = () => new Date().toISOString().slice(0, 10)

// GET /api/children/:id/stats?week=YYYY-MM-DD  (any day of the wanted week; default: this week)
// Parent and linked specialists only — the child gets 403 (FR-M7-05).
statsRouter.get(
  '/children/:id/stats',
  requireAuth,
  requireRole('parent', 'specialist'),
  requireLinkedAccess,
  (req, res) => {
    const day = req.query.week || today()
    try {
      res.json(computeWeeklyStats(listTasksForChild(req.child.id), day))
    } catch (err) {
      if (err instanceof RangeError) return res.status(400).json({ error: err.message })
      throw err
    }
  },
)
