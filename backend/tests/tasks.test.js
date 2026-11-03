import request from 'supertest'
import { app } from '../src/app.js'
import { db } from '../src/db.js'

describe('GET /api/tasks', () => {
  beforeEach(() => {
    db.exec('DELETE FROM tasks')
  })

  test('returns an empty list when there are no tasks', async () => {
    const res = await request(app).get('/api/tasks')

    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  test('returns the task stored in the database', async () => {
    db.prepare(
      `INSERT INTO tasks (title, description, development_area, due_date, status)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('Practice counting to 20', 'Count out loud together twice a day.', 'Cognitive', '2026-11-07', 'pending')

    const res = await request(app).get('/api/tasks')

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0]).toMatchObject({
      title: 'Practice counting to 20',
      development_area: 'Cognitive',
      due_date: '2026-11-07',
      status: 'pending',
    })
  })
})
