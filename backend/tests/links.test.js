import request from 'supertest'
import { app } from '../src/app.js'
import { db } from '../src/db.js'
import { signToken } from '../src/auth.js'
import { createUser } from '../src/users.js'

const PASSWORD = 'Secret123!'
let parent, otherParent, child, specialist, otherSpecialist
let tokens

function reset() {
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

function link(email = 'spec@test.local', type = 'psychologist', who = 'parent') {
  return request(app).post(`/api/children/${child.id}/specialists`).set(auth(who)).send({ email, type })
}

beforeEach(reset)

describe('linking a specialist (FR-M2-01, 02, 03, 07)', () => {
  test('the parent links a registered specialist and sees them in the list', async () => {
    const res = await link()
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ id: specialist.id, name: 'Spec', type: 'psychologist' })

    const list = await request(app).get(`/api/children/${child.id}/specialists`).set(auth('parent'))
    expect(list.status).toBe(200)
    expect(list.body.map((s) => s.email)).toEqual(['spec@test.local'])
  })

  test('an email that is not a registered specialist returns 404', async () => {
    expect((await link('nobody@test.local')).status).toBe(404)
    // a registered user with another role is not a specialist either
    expect((await link('other@test.local')).status).toBe(404)
  })

  test('the same specialist cannot be linked twice', async () => {
    await link()
    const res = await link()
    expect(res.status).toBe(409)
  })

  test('missing fields or an unknown type return 400', async () => {
    expect((await link('spec@test.local', '')).status).toBe(400)
    expect((await link('spec@test.local', 'astronaut')).status).toBe(400)
  })

  test("only the child's own parent can manage links", async () => {
    expect((await link('spec@test.local', 'coach', 'otherParent')).status).toBe(403)
    expect((await link('spec@test.local', 'coach', 'specialist')).status).toBe(403)
    expect((await link('spec@test.local', 'coach', 'child')).status).toBe(403)
  })

  test('a request without a token returns 401', async () => {
    const res = await request(app).get(`/api/children/${child.id}/specialists`)
    expect(res.status).toBe(401)
  })
})

describe('specialist view (FR-M2-05)', () => {
  test('a specialist sees only the children linked to them', async () => {
    await link()
    const mine = await request(app).get('/api/me/children').set(auth('specialist'))
    expect(mine.body.map((c) => c.name)).toEqual(['Child'])

    const other = await request(app).get('/api/me/children').set(auth('otherSpecialist'))
    expect(other.body).toEqual([])
  })

  test('a parent sees their own children', async () => {
    const res = await request(app).get('/api/me/children').set(auth('parent'))
    expect(res.body.map((c) => c.id)).toEqual([child.id])
  })
})

describe('requireLinkedAccess (FR-M2-06)', () => {
  test('parent, child and linked specialist get access; others get 403', async () => {
    await link()
    const get = (who) => request(app).get(`/api/children/${child.id}`).set(auth(who))

    expect((await get('parent')).status).toBe(200)
    expect((await get('child')).status).toBe(200)
    expect((await get('specialist')).status).toBe(200)
    expect((await get('otherSpecialist')).status).toBe(403)
    expect((await get('otherParent')).status).toBe(403)
  })

  test('an unknown child returns 404', async () => {
    const res = await request(app).get('/api/children/99999').set(auth('parent'))
    expect(res.status).toBe(404)
  })

  test('Flow 2: after unlinking, the same still-valid token gets 403 (FR-M2-04)', async () => {
    await link()
    expect((await request(app).get(`/api/children/${child.id}`).set(auth('specialist'))).status).toBe(200)

    const del = await request(app)
      .delete(`/api/children/${child.id}/specialists/${specialist.id}`)
      .set(auth('parent'))
    expect(del.status).toBe(204)

    const mine = await request(app).get('/api/me/children').set(auth('specialist'))
    expect(mine.body).toEqual([])
    expect((await request(app).get(`/api/children/${child.id}`).set(auth('specialist'))).status).toBe(403)
  })

  test('unlinking a specialist who is not linked returns 404', async () => {
    const res = await request(app)
      .delete(`/api/children/${child.id}/specialists/${specialist.id}`)
      .set(auth('parent'))
    expect(res.status).toBe(404)
  })
})
