import request from 'supertest'
import { app } from '../src/app.js'
import { signToken } from '../src/auth.js'
import { db } from '../src/db.js'
import { computeWeeklyStats, weekRange } from '../src/stats.js'
import { createUser } from '../src/users.js'

const task = (due_date, development_area, status = 'pending') => ({ due_date, development_area, status })

describe('weekRange', () => {
  test('returns the Monday–Sunday week of any day', () => {
    expect(weekRange('2026-11-11')).toEqual({ start: '2026-11-09', end: '2026-11-15' }) // Wednesday
    expect(weekRange('2026-11-09')).toEqual({ start: '2026-11-09', end: '2026-11-15' }) // Monday
    expect(weekRange('2026-11-15')).toEqual({ start: '2026-11-09', end: '2026-11-15' }) // Sunday
    expect(weekRange('2026-12-30')).toEqual({ start: '2026-12-28', end: '2027-01-03' }) // across years
  })

  test('returns null for an invalid date', () => {
    expect(weekRange('2026-13-01')).toBeNull()
    expect(weekRange('2026-02-30')).toBeNull()
    expect(weekRange('next week')).toBeNull()
  })
})

describe('computeWeeklyStats (FR-M7-01, 02, 03)', () => {
  const tasks = [
    task('2026-11-09', 'Language', 'done'),
    task('2026-11-12', 'Language'),
    task('2026-11-15', 'Motor', 'done'),
    task('2026-11-08', 'Motor', 'done'), // previous week: not counted
    task('2026-11-16', 'Social'), // next week: not counted
  ]

  test('rate = completed ÷ due in the week, in total and per area', () => {
    const stats = computeWeeklyStats(tasks, '2026-11-11')
    expect(stats.week).toEqual({ start: '2026-11-09', end: '2026-11-15' })
    expect(stats.total).toEqual({ done: 2, due: 3, rate: 67 })
    expect(stats.byArea).toEqual([
      { area: 'Language', done: 1, due: 2, rate: 50 },
      { area: 'Motor', done: 1, due: 1, rate: 100 },
    ])
  })

  test('a week without tasks has no rate', () => {
    expect(computeWeeklyStats(tasks, '2026-11-25')).toEqual({
      week: { start: '2026-11-23', end: '2026-11-29' },
      total: null,
      byArea: [],
    })
  })

  test('an invalid date throws', () => {
    expect(() => computeWeeklyStats(tasks, 'soon')).toThrow(RangeError)
  })
})

describe('GET /api/children/:id/stats (FR-M7-05)', () => {
  let child, tokens

  beforeEach(() => {
    db.exec('DELETE FROM tasks')
    db.exec('DELETE FROM specialist_links')
    db.exec('DELETE FROM users')
    const make = (name, role, extra = {}) =>
      createUser({ name, email: `${name}@test.local`, password: 'Secret123!', role, ...extra })
    const parent = make('parent', 'parent')
    child = make('child', 'child', { parentId: parent.id })
    const linked = make('linked', 'specialist')
    const stranger = make('stranger', 'specialist')
    db.prepare('INSERT INTO specialist_links (child_id, specialist_id, specialist_type) VALUES (?, ?, ?)').run(
      child.id,
      linked.id,
      'teacher',
    )
    const insert = db.prepare(
      `INSERT INTO tasks (child_id, assigned_by, title, development_area, due_date, status) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    insert.run(child.id, linked.id, 'A', 'Language', '2026-11-10', 'done')
    insert.run(child.id, linked.id, 'B', 'Motor', '2026-11-11', 'pending')
    tokens = Object.fromEntries([parent, child, linked, stranger].map((u) => [u.name, signToken(u)]))
  })

  const get = (who, week = '2026-11-11') =>
    request(app).get(`/api/children/${child.id}/stats?week=${week}`).set('Authorization', `Bearer ${tokens[who]}`)

  test('the parent and a linked specialist see the statistics', async () => {
    for (const who of ['parent', 'linked']) {
      const res = await get(who)
      expect(res.status).toBe(200)
      expect(res.body.total).toEqual({ done: 1, due: 2, rate: 50 })
    }
  })

  test('the child and an unlinked specialist get 403', async () => {
    expect((await get('child')).status).toBe(403)
    expect((await get('stranger')).status).toBe(403)
  })

  test('an empty week returns total null; a bad date returns 400', async () => {
    expect((await get('parent', '2026-12-01')).body.total).toBeNull()
    expect((await get('parent', 'banana')).status).toBe(400)
  })
})
