import request from 'supertest'
import { app } from '../src/app.js'
import { signToken } from '../src/auth.js'
import { db } from '../src/db.js'
import { createUser } from '../src/users.js'

const PASSWORD = 'Secret123!'
let parent, otherParent, child, specialist, otherSpecialist
let tokens

function reset() {
  db.exec('DELETE FROM tasks')
  db.exec('DELETE FROM specialist_links')
  db.exec('DELETE FROM users')
  parent = createUser({ name: 'Parent', email: 'parent@test.local', password: PASSWORD, role: 'parent' })
  otherParent = createUser({ name: 'Other Parent', email: 'other@test.local', password: PASSWORD, role: 'parent' })
  child = createUser({ name: 'Child', email: 'child@test.local', password: PASSWORD, role: 'child', parentId: parent.id })
  specialist = createUser({ name: 'Spec', email: 'spec@test.local', password: PASSWORD, role: 'specialist' })
  otherSpecialist = createUser({ name: 'Spec 2', email: 'spec2@test.local', password: PASSWORD, role: 'specialist' })
  tokens = Object.fromEntries(
    Object.entries({ parent, otherParent, child, specialist, otherSpecialist }).map(([k, u]) => [k, signToken(u)]),
  )
}

const auth = (who) => ({ Authorization: `Bearer ${tokens[who]}` })

function link(specialistUser = specialist) {
  db.prepare(
    'INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)',
  ).run(child.id, specialistUser.id, 'psychologist')
}

function assign(overrides = {}, who = 'parent') {
  return request(app)
    .post(`/api/children/${child.id}/tasks`)
    .set(auth(who))
    .send({
      title: 'Practice counting to 20',
      description: 'Count out loud together twice a day.',
      development_area: 'Cognitive',
      due_date: '2026-11-07',
      ...overrides,
    })
}

beforeEach(reset)

describe('assigning a task (FR-M4-01, FR-M4-02, FR-M4-03)', () => {
  test('a parent assigns a task to their child', async () => {
    const res = await assign()
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      child_id: child.id,
      assigned_by: parent.id,
      title: 'Practice counting to 20',
      development_area: 'Cognitive',
      due_date: '2026-11-07',
      status: 'pending',
    })
  })

  test('a linked specialist can also assign a task', async () => {
    link()
    const res = await assign({}, 'specialist')
    expect(res.status).toBe(201)
  })

  test('an unlinked specialist cannot assign a task', async () => {
    const res = await assign({}, 'specialist')
    expect(res.status).toBe(403)
  })

  test('a child cannot assign a task', async () => {
    const res = await assign({}, 'child')
    expect(res.status).toBe(403)
  })

  test('missing title, development area or due date returns 400', async () => {
    expect((await assign({ title: '' })).status).toBe(400)
    expect((await assign({ development_area: '' })).status).toBe(400)
    expect((await assign({ due_date: '' })).status).toBe(400)
  })

  test('an unknown development area returns 400', async () => {
    const res = await assign({ development_area: 'Astronomy' })
    expect(res.status).toBe(400)
  })
})

describe('viewing tasks (FR-M4-04, FR-M4-07)', () => {
  test('the child sees only their own tasks', async () => {
    await assign()
    const res = await request(app).get(`/api/children/${child.id}/tasks`).set(auth('child'))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })

  test('the parent sees all tasks of their child, regardless of who assigned them', async () => {
    link()
    await assign({ title: 'From parent' })
    await assign({ title: 'From specialist' }, 'specialist')

    const res = await request(app).get(`/api/children/${child.id}/tasks`).set(auth('parent'))
    expect(res.status).toBe(200)
    expect(res.body.map((t) => t.title).sort()).toEqual(['From parent', 'From specialist'])
  })

  test("another parent cannot view the child's tasks", async () => {
    await assign()
    const res = await request(app).get(`/api/children/${child.id}/tasks`).set(auth('otherParent'))
    expect(res.status).toBe(403)
  })

  test('a request without a token returns 401', async () => {
    const res = await request(app).get(`/api/children/${child.id}/tasks`)
    expect(res.status).toBe(401)
  })
})

describe('marking a task done (FR-M4-05)', () => {
  test('the child marks their own task done', async () => {
    const created = await assign()
    const res = await request(app).patch(`/api/tasks/${created.body.id}/status`).set(auth('child'))
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('done')
    expect(res.body.done_at).not.toBeNull()
  })

  test('a parent or specialist cannot mark a task done', async () => {
    const created = await assign()
    expect((await request(app).patch(`/api/tasks/${created.body.id}/status`).set(auth('parent'))).status).toBe(403)
  })
})

describe("the assigner's status list (FR-M4-06)", () => {
  test('the assigner sees the tasks they assigned, with status', async () => {
    const created = await assign()
    await request(app).patch(`/api/tasks/${created.body.id}/status`).set(auth('child'))

    const res = await request(app).get('/api/me/assigned-tasks').set(auth('parent'))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].status).toBe('done')
  })

  test('an assigner only sees tasks they personally assigned', async () => {
    link()
    await assign({ title: 'From parent' })
    await assign({ title: 'From specialist' }, 'specialist')

    const res = await request(app).get('/api/me/assigned-tasks').set(auth('specialist'))
    expect(res.body.map((t) => t.title)).toEqual(['From specialist'])
  })

  test('Flow 1: a specialist assigns a task and sees it done after the child completes it', async () => {
    link()
    const created = await assign({ title: 'Read for 20 minutes' }, 'specialist')
    await request(app).patch(`/api/tasks/${created.body.id}/status`).set(auth('child'))

    const res = await request(app).get('/api/me/assigned-tasks').set(auth('specialist'))
    expect(res.body).toEqual([expect.objectContaining({ title: 'Read for 20 minutes', status: 'done' })])
  })
})
