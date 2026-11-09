import express from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { app } from '../src/app.js'
import { requireAuth, requireRole } from '../src/auth.js'
import { db } from '../src/db.js'
import { createUser } from '../src/users.js'

const PASSWORD = 'Secret123!'

function resetUsers() {
  db.exec('DELETE FROM users')
  const parent = createUser({ name: 'Parent', email: 'parent@test.local', password: PASSWORD, role: 'parent' })
  const child = createUser({ name: 'Child', email: 'child@test.local', password: PASSWORD, role: 'child', parentId: parent.id })
  return { parent, child }
}

function login(email, password = PASSWORD) {
  return request(app).post('/api/auth/login').send({ email, password })
}

describe('POST /api/auth/login', () => {
  beforeEach(resetUsers)

  test('returns a token and the user for correct credentials', async () => {
    const res = await login('parent@test.local')

    expect(res.status).toBe(200)
    expect(typeof res.body.token).toBe('string')
    expect(res.body.user).toEqual({ id: expect.any(Number), name: 'Parent', email: 'parent@test.local', role: 'parent' })
    expect(res.body.user).not.toHaveProperty('password_hash')
  })

  test('the token holds the role and an expiry, but no password', async () => {
    const res = await login('parent@test.local')
    const payload = jwt.decode(res.body.token)

    expect(payload.role).toBe('parent')
    expect(payload.exp).toBeGreaterThan(payload.iat)
    expect(JSON.stringify(payload)).not.toContain(PASSWORD)
  })

  test('wrong password and unknown email give the same error', async () => {
    const wrongPassword = await login('parent@test.local', 'nope')
    const unknownEmail = await login('nobody@test.local')

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body.error).toBe(unknownEmail.body.error)
  })

  test('missing fields give 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'parent@test.local' })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/auth/me', () => {
  beforeEach(resetUsers)

  test('returns the logged-in user with a valid token', async () => {
    const { body } = await login('child@test.local')
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`)

    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('child')
  })

  test('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })

  test('returns 401 with an invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-token')
    expect(res.status).toBe(401)
  })
})

describe('requireRole', () => {
  // A small test app with a parent-only route.
  const testApp = express()
  testApp.get('/parent-only', requireAuth, requireRole('parent'), (req, res) => res.json({ ok: true }))

  beforeEach(resetUsers)

  test('allows the right role', async () => {
    const { body } = await login('parent@test.local')
    const res = await request(testApp).get('/parent-only').set('Authorization', `Bearer ${body.token}`)
    expect(res.status).toBe(200)
  })

  test('returns 403 for another role', async () => {
    const { body } = await login('child@test.local')
    const res = await request(testApp).get('/parent-only').set('Authorization', `Bearer ${body.token}`)
    expect(res.status).toBe(403)
  })
})
