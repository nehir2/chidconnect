import { db } from './db.js'

db.exec('DELETE FROM tasks')

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

console.log('Seeded 1 task.')
