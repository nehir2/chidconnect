import cors from 'cors'
import express from 'express'
import { db } from './db.js'
import { authRouter } from './routes/auth.js'
import { linksRouter } from './routes/links.js'

// The Express app is defined here without app.listen(),
// so the tests can import it and call the API with Supertest.
export const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api', linksRouter)

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id').all()
  res.json(tasks)
})
