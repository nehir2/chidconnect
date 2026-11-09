import { Router } from 'express'
import { requireAuth, requireRole } from '../auth.js'
import {
  LinkError,
  SPECIALIST_TYPES,
  childrenOf,
  linkSpecialist,
  listSpecialists,
  requireLinkedAccess,
  unlinkSpecialist,
} from '../links.js'

export const linksRouter = Router()

function handle(fn) {
  return (req, res) => {
    try {
      fn(req, res)
    } catch (err) {
      if (err instanceof LinkError) return res.status(err.status).json({ error: err.message })
      throw err
    }
  }
}

// GET /api/specialist-types  →  the types a parent can choose from
linksRouter.get('/specialist-types', requireAuth, (req, res) => {
  res.json(SPECIALIST_TYPES)
})

// GET /api/me/children  →  parent: own children, specialist: linked children (FR-M2-05)
linksRouter.get('/me/children', requireAuth, (req, res) => {
  res.json(childrenOf(req.user))
})

// GET /api/children/:id  →  basic child info; any request about a child goes through requireLinkedAccess
linksRouter.get('/children/:id', requireAuth, requireLinkedAccess, (req, res) => {
  const { id, name } = req.child
  res.json({ id, name })
})

// Only the child's own parent manages the links.
const parentOnly = [requireAuth, requireRole('parent'), requireLinkedAccess]

// GET /api/children/:id/specialists  (FR-M2-03)
linksRouter.get('/children/:id/specialists', parentOnly, (req, res) => {
  res.json(listSpecialists(req.child.id))
})

// POST /api/children/:id/specialists  { email, type }  (FR-M2-01, FR-M2-02, FR-M2-07)
linksRouter.post(
  '/children/:id/specialists',
  parentOnly,
  handle((req, res) => {
    const link = linkSpecialist(req.child.id, req.body || {})
    res.status(201).json(link)
  }),
)

// DELETE /api/children/:id/specialists/:specialistId  (FR-M2-04)
linksRouter.delete(
  '/children/:id/specialists/:specialistId',
  parentOnly,
  handle((req, res) => {
    unlinkSpecialist(req.child.id, Number(req.params.specialistId))
    res.status(204).end()
  }),
)
