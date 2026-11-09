import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { requireAuth, signToken } from '../auth.js'
import { findUserByEmail, publicUser } from '../users.js'

export const authRouter = Router()

// POST /api/auth/login  { email, password }  →  { token, user }
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const user = findUserByEmail(email)
  const ok = user && bcrypt.compareSync(String(password), user.password_hash)
  if (!ok) {
    // Same message for a wrong email and a wrong password (FR-M1-02).
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  res.json({ token: signToken(user), user: publicUser(user) })
})

// GET /api/auth/me  →  the logged-in user
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})
