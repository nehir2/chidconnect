import cors from 'cors'
import express from 'express'
import { authRouter } from './routes/auth.js'
import { linksRouter } from './routes/links.js'
import { tasksRouter } from './routes/tasks.js'

// The Express app is defined here without app.listen(),
// so the tests can import it and call the API with Supertest.
export const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api', linksRouter)
app.use('/api', tasksRouter)
