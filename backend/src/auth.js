import jwt from 'jsonwebtoken'
import { findUserById } from './users.js'

// In production the secret must come from the environment (.env, never committed).
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me'
const JWT_EXPIRES_IN = '2h'

// The token holds only the user id and role: no password and no child records (FR-M1-03).
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// 401 when the token is missing, invalid or expired (FR-M1-06).
export function requireAuth(req, res, next) {
  const header = req.get('Authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = findUserById(payload.sub)
    if (!user) return res.status(401).json({ error: 'Authentication required' })
    req.user = user // role is read from the database, not trusted from the client (FR-M1-04)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// 403 when the logged-in user's role is not allowed (FR-M1-06). Use after requireAuth.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    next()
  }
}
