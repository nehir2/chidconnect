import bcrypt from 'bcryptjs'
import { db } from './db.js'

const ROLES = ['parent', 'specialist', 'child']

// Creates a user with a bcrypt-hashed password and returns the user without the hash.
export function createUser({ name, email, password, role, parentId = null }) {
  if (!ROLES.includes(role)) throw new Error(`Unknown role: ${role}`)
  const passwordHash = bcrypt.hashSync(password, 10)
  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, parent_id)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(name, email.toLowerCase(), passwordHash, role, parentId)
  return { id: Number(result.lastInsertRowid), name, email: email.toLowerCase(), role, parentId }
}

export function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase())
}

export function findUserById(id) {
  return db.prepare('SELECT id, name, email, role, parent_id FROM users WHERE id = ?').get(id)
}

// The fields that are safe to send to the client (never the password hash).
export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}
