import { db } from './db.js'
import { findUserByEmail } from './users.js'

export const SPECIALIST_TYPES = [
  'teacher',
  'psychologist',
  'doctor',
  'special education teacher',
  'coach',
]

// Errors carry an HTTP status so the router can answer with the right code.
export class LinkError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function findChild(childId) {
  return db
    .prepare("SELECT id, name, email, role, parent_id FROM users WHERE id = ? AND role = 'child'")
    .get(childId)
}

export function isLinked(childId, specialistId) {
  return Boolean(
    db
      .prepare('SELECT 1 FROM specialist_links WHERE child_id = ? AND specialist_id = ?')
      .get(childId, specialistId),
  )
}

// Who may see data about a child: their parent, the child, or a currently linked specialist.
export function canAccessChild(user, child) {
  if (!user || !child) return false
  if (user.role === 'parent') return child.parent_id === user.id
  if (user.role === 'child') return child.id === user.id
  if (user.role === 'specialist') return isLinked(child.id, user.id)
  return false
}

export function listSpecialists(childId) {
  return db
    .prepare(
      `SELECT u.id, u.name, u.email, l.specialist_type AS type, l.created_at AS linkedAt
       FROM specialist_links l JOIN users u ON u.id = l.specialist_id
       WHERE l.child_id = ? ORDER BY l.id`,
    )
    .all(childId)
}

// FR-M2-01, FR-M2-02, FR-M2-07
export function linkSpecialist(childId, { email, type }) {
  if (!email || !type) throw new LinkError(400, 'Email and specialist type are required')
  if (!SPECIALIST_TYPES.includes(type)) throw new LinkError(400, 'Unknown specialist type')

  const specialist = findUserByEmail(email)
  if (!specialist || specialist.role !== 'specialist') {
    throw new LinkError(404, 'No registered specialist with this email')
  }
  if (isLinked(childId, specialist.id)) {
    throw new LinkError(409, 'This specialist is already linked to the child')
  }

  db.prepare(
    'INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)',
  ).run(childId, specialist.id, type)

  return listSpecialists(childId).find((s) => s.id === specialist.id)
}

// FR-M2-04: deleting the row is what blocks every later request of the specialist.
export function unlinkSpecialist(childId, specialistId) {
  const result = db
    .prepare('DELETE FROM specialist_links WHERE child_id = ? AND specialist_id = ?')
    .run(childId, specialistId)
  if (result.changes === 0) throw new LinkError(404, 'Link not found')
}

// The children shown on a user's home screen (FR-M2-05 for specialists).
export function childrenOf(user) {
  if (user.role === 'parent') {
    return db
      .prepare("SELECT id, name, email FROM users WHERE role = 'child' AND parent_id = ? ORDER BY id")
      .all(user.id)
  }
  if (user.role === 'specialist') {
    return db
      .prepare(
        `SELECT u.id, u.name, u.email, l.specialist_type AS type
         FROM specialist_links l JOIN users u ON u.id = l.child_id
         WHERE l.specialist_id = ? ORDER BY u.id`,
      )
      .all(user.id)
  }
  return []
}

// Express middleware for every /children/:id/... route (FR-M2-06).
// The link is read from the database on every request, so an unlinked
// specialist gets 403 even while their JWT is still valid. Use after requireAuth.
export function requireLinkedAccess(req, res, next) {
  const child = findChild(Number(req.params.id))
  if (!child) return res.status(404).json({ error: 'Child not found' })
  if (!canAccessChild(req.user, child)) return res.status(403).json({ error: 'Forbidden' })
  req.child = child
  next()
}
