import cors from 'cors'
import express from 'express'
import { db } from './db.js'

// The Express app is defined here without app.listen(),
// so the tests can import it and call the API with Supertest.
export const app = express()
app.use(cors())

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id').all()
  res.json(tasks)
})
