import cors from 'cors'
import express from 'express'
import { db } from './db.js'

const app = express()
app.use(cors())

app.get('/api/tasks', (req, res) => {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id').all()
  res.json(tasks)
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
