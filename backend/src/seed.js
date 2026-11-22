import { db } from './db.js'
import { weekRange } from './events.js'
import { createUser } from './users.js'

// Synthetic sample data only: no real personal data.
export const SEED_PASSWORD = 'Password123!'

db.exec('DELETE FROM events')
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
  `INSERT INTO tasks (child_id, assigned_by, title, description, development_area, due_date, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
).run(
  child.id,
  specialist.id,
  'Practice counting to 20',
  'Count out loud together twice a day.',
  'Cognitive',
  '2026-11-07',
  'pending',
)

// Two events in the current week, so the weekly schedule is not empty in a demo.
const { start } = weekRange()
const day = (offset) =>
  new Date(new Date(`${start}T00:00:00Z`).getTime() + offset * 86_400_000).toISOString().slice(0, 10)
const insertEvent = db.prepare(
  `INSERT INTO events (child_id, created_by, title, event_date, start_time, end_time)
   VALUES (?, ?, ?, ?, ?, ?)`,
)
insertEvent.run(child.id, parent.id, 'Speech therapy', day(0), '10:00', '11:00')
insertEvent.run(child.id, specialist.id, 'Doctor appointment', day(4), '09:30', '10:30')

console.log('Seeded 4 users (parent, child, 2 specialists), 1 specialist link, 1 task and 2 events.')
console.log(`Demo password for all users: ${SEED_PASSWORD}`)
