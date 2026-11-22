import request from 'supertest'
import { app } from '../src/app.js'
import { signToken } from '../src/auth.js'
import { db } from '../src/db.js'
import { weekRange } from '../src/events.js'
import { createUser } from '../src/users.js'

const PASSWORD = 'Secret123!'
let parent, otherParent, child, specialist, otherSpecialist
let tokens

function reset() {
  db.exec('DELETE FROM events')
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

// 2026-11-09 is a Monday, so the week of 2026-11-09 … 2026-11-15 is used throughout.
function addEvent(overrides = {}, who = 'parent') {
  return request(app)
    .post(`/api/children/${child.id}/events`)
    .set(auth(who))
    .send({
      title: 'Speech therapy',
      event_date: '2026-11-10',
      start_time: '10:00',
      end_time: '11:00',
      ...overrides,
    })
}

function listWeek(week, who = 'parent') {
  return request(app).get(`/api/children/${child.id}/events?week=${week}`).set(auth(who))
}

beforeEach(reset)

describe('weekRange (FR-M3-02)', () => {
  test('returns Monday to Sunday for any day of the week', () => {
    expect(weekRange('2026-11-09')).toEqual({ start: '2026-11-09', end: '2026-11-15' })
    expect(weekRange('2026-11-12')).toEqual({ start: '2026-11-09', end: '2026-11-15' })
    expect(weekRange('2026-11-15')).toEqual({ start: '2026-11-09', end: '2026-11-15' })
  })

  test('crosses a month and year boundary', () => {
    expect(weekRange('2026-12-31')).toEqual({ start: '2026-12-28', end: '2027-01-03' })
  })
})

describe('adding an event (FR-M3-01, FR-M3-05)', () => {
  test('a parent adds an event for their child', async () => {
    const res = await addEvent()
    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      child_id: child.id,
      created_by: parent.id,
      title: 'Speech therapy',
      event_date: '2026-11-10',
      start_time: '10:00',
      end_time: '11:00',
    })
  })

  test('a linked specialist can also add an event', async () => {
    link()
    expect((await addEvent({}, 'specialist')).status).toBe(201)
  })

  test('an unlinked specialist, another parent and the child cannot add an event', async () => {
    expect((await addEvent({}, 'specialist')).status).toBe(403)
    expect((await addEvent({}, 'otherParent')).status).toBe(403)
    expect((await addEvent({}, 'child')).status).toBe(403)
  })

  test('missing fields return 400', async () => {
    expect((await addEvent({ title: '' })).status).toBe(400)
    expect((await addEvent({ event_date: '' })).status).toBe(400)
    expect((await addEvent({ start_time: '' })).status).toBe(400)
    expect((await addEvent({ end_time: '' })).status).toBe(400)
  })

  test('an end time that is not after the start time returns 400', async () => {
    expect((await addEvent({ start_time: '11:00', end_time: '10:00' })).status).toBe(400)
    expect((await addEvent({ start_time: '10:00', end_time: '10:00' })).status).toBe(400)
  })

  test('an invalid date or time format returns 400', async () => {
    expect((await addEvent({ event_date: '2026-02-31' })).status).toBe(400)
    expect((await addEvent({ event_date: '10.11.2026' })).status).toBe(400)
    expect((await addEvent({ start_time: '25:00' })).status).toBe(400)
  })

  test('a request without a token returns 401', async () => {
    const res = await request(app).post(`/api/children/${child.id}/events`).send({})
    expect(res.status).toBe(401)
  })
})

describe('the weekly view (FR-M3-02, FR-M3-03, FR-M3-04)', () => {
  test('lists only the selected Monday–Sunday week, in time order', async () => {
    await addEvent({ title: 'Sunday', event_date: '2026-11-15', start_time: '09:00', end_time: '10:00' })
    await addEvent({ title: 'Monday late', event_date: '2026-11-09', start_time: '15:00', end_time: '16:00' })
    await addEvent({ title: 'Monday early', event_date: '2026-11-09', start_time: '08:00', end_time: '09:00' })
    await addEvent({ title: 'Next Monday', event_date: '2026-11-16' })
    await addEvent({ title: 'Previous Sunday', event_date: '2026-11-08' })

    const res = await listWeek('2026-11-12')
    expect(res.status).toBe(200)
    expect(res.body.week_start).toBe('2026-11-09')
    expect(res.body.week_end).toBe('2026-11-15')
    expect(res.body.events.map((e) => e.title)).toEqual(['Monday early', 'Monday late', 'Sunday'])
  })

  test('the previous and next week return their own events', async () => {
    await addEvent({ title: 'This week', event_date: '2026-11-10' })
    await addEvent({ title: 'Next week', event_date: '2026-11-17' })

    expect((await listWeek('2026-11-17')).body.events.map((e) => e.title)).toEqual(['Next week'])
    expect((await listWeek('2026-11-03')).body.events).toEqual([])
  })

  test('the child sees their own events, and a linked specialist sees them too', async () => {
    link()
    await addEvent()
    expect((await listWeek('2026-11-10', 'child')).body.events).toHaveLength(1)
    expect((await listWeek('2026-11-10', 'specialist')).body.events).toHaveLength(1)
  })

  test('another parent and an unlinked specialist get 403', async () => {
    await addEvent()
    expect((await listWeek('2026-11-10', 'otherParent')).status).toBe(403)
    expect((await listWeek('2026-11-10', 'otherSpecialist')).status).toBe(403)
  })

  test('the child cannot add, edit or delete events (read-only)', async () => {
    const created = await addEvent()
    expect((await addEvent({}, 'child')).status).toBe(403)
    const put = await request(app).put(`/api/events/${created.body.id}`).set(auth('child')).send({})
    expect(put.status).toBe(403)
    const del = await request(app).delete(`/api/events/${created.body.id}`).set(auth('child'))
    expect(del.status).toBe(403)
  })

  test('an invalid week returns 400', async () => {
    expect((await listWeek('next-week')).status).toBe(400)
  })

  test('without a week parameter the current week is used', async () => {
    const res = await request(app).get(`/api/children/${child.id}/events`).set(auth('parent'))
    expect(res.status).toBe(200)
    expect(res.body.week_start).toBe(weekRange().start)
  })
})

describe('editing and deleting an event (FR-M3-06)', () => {
  test('the creator edits their event', async () => {
    const created = await addEvent()
    const res = await request(app)
      .put(`/api/events/${created.body.id}`)
      .set(auth('parent'))
      .send({ title: 'Moved', event_date: '2026-11-11', start_time: '14:00', end_time: '15:00' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ title: 'Moved', event_date: '2026-11-11', start_time: '14:00' })
  })

  test('an edit that breaks the validation rules returns 400', async () => {
    const created = await addEvent()
    const res = await request(app)
      .put(`/api/events/${created.body.id}`)
      .set(auth('parent'))
      .send({ title: 'Bad', event_date: '2026-11-11', start_time: '15:00', end_time: '14:00' })
    expect(res.status).toBe(400)
  })

  test('the creator deletes their event', async () => {
    const created = await addEvent()
    const del = await request(app).delete(`/api/events/${created.body.id}`).set(auth('parent'))
    expect(del.status).toBe(204)
    expect((await listWeek('2026-11-10')).body.events).toEqual([])
  })

  test("a user cannot edit or delete an event somebody else created", async () => {
    link()
    const created = await addEvent({}, 'specialist')
    const put = await request(app)
      .put(`/api/events/${created.body.id}`)
      .set(auth('parent'))
      .send({ title: 'Hijack', event_date: '2026-11-10', start_time: '10:00', end_time: '11:00' })
    expect(put.status).toBe(403)
    const del = await request(app).delete(`/api/events/${created.body.id}`).set(auth('parent'))
    expect(del.status).toBe(403)
  })

  test('a specialist who was unlinked can no longer change their old event', async () => {
    link()
    const created = await addEvent({}, 'specialist')
    db.exec('DELETE FROM specialist_links')
    const del = await request(app).delete(`/api/events/${created.body.id}`).set(auth('specialist'))
    expect(del.status).toBe(403)
  })

  test('an unknown event returns 404', async () => {
    const res = await request(app).delete('/api/events/9999').set(auth('parent'))
    expect(res.status).toBe(404)
  })
})
