import { db } from './db.js'
import { createUser } from './users.js'

// Synthetic sample data only: no real personal data.
export const SEED_PASSWORD = 'Password123!'

db.exec('DELETE FROM specialist_links')
db.exec('DELETE FROM tasks')
db.exec('DELETE FROM users')

const parent = createUser({
  name: 'Ayşe Demo',
  email: 'parent@childconnect.test',
  password: SEED_PASSWORD,
  role: 'parent',
})
const child = createUser({
  name: 'Can Demo',
  email: 'child@childconnect.test',
  password: SEED_PASSWORD,
  role: 'child',
  parentId: parent.id,
})
const specialist = createUser({
  name: 'Deniz Demo',
  email: 'specialist@childconnect.test',
  password: SEED_PASSWORD,
  role: 'specialist',
})
// A second specialist who is not linked yet, to try the link form.
createUser({
  name: 'Ece Demo',
  email: 'teacher@childconnect.test',
  password: SEED_PASSWORD,
  role: 'specialist',
})

db.prepare(
  'INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)',
).run(child.id, specialist.id, 'psychologist')

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

console.log('Seeded 4 users (parent, child, 2 specialists), 1 specialist link and 1 task.')
console.log(`Demo password for all users: ${SEED_PASSWORD}`)
