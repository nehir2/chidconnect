import { db } from './db.js'
import { createUser } from './users.js'

// Synthetic sample data only: no real personal data.
export const SEED_PASSWORD = 'Password123!'

db.exec('DELETE FROM tasks')
db.exec('DELETE FROM users')

const parent = createUser({
  name: 'Ayşe Demo',
  email: 'parent@childconnect.test',
  password: SEED_PASSWORD,
  role: 'parent',
})
createUser({
  name: 'Can Demo',
  email: 'child@childconnect.test',
  password: SEED_PASSWORD,
  role: 'child',
  parentId: parent.id,
})
createUser({
  name: 'Deniz Demo',
  email: 'specialist@childconnect.test',
  password: SEED_PASSWORD,
  role: 'specialist',
})

db.prepare(
  `INSERT INTO tasks (title, description, development_area, due_date, status)
   VALUES (?, ?, ?, ?, ?)`,
).run(
  'Practice counting to 20',
  'Count out loud together twice a day.',
  'Cognitive',
  '2026-11-07',
  'pending',
)

console.log('Seeded 3 users (parent, child, specialist) and 1 task.')
console.log(`Demo password for all users: ${SEED_PASSWORD}`)
