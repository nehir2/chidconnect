import { db } from './db.js'

// FR-M4-03: the fixed list a task's development area must come from.
export const DEVELOPMENT_AREAS = ['Language', 'Motor', 'Social', 'Cognitive', 'Self-care']

// Errors carry an HTTP status so the router can answer with the right code.
export class TaskError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function getTask(id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
}

// FR-M4-01, FR-M4-02, FR-M4-03: parent or linked specialist assigns a task.
export function assignTask(childId, assignedBy, { title, description, development_area, due_date }) {
  if (!title || !development_area || !due_date) {
    throw new TaskError(400, 'Title, development area and due date are required')
  }
  if (!DEVELOPMENT_AREAS.includes(development_area)) {
    throw new TaskError(400, 'Unknown development area')
  }

  const result = db
    .prepare(
      `INSERT INTO tasks (child_id, assigned_by, title, description, development_area, due_date, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
    )
    .run(childId, assignedBy, title, description || null, development_area, due_date)

  return getTask(result.lastInsertRowid)
}

// FR-M4-04, FR-M4-07: the child sees only their own tasks; the parent sees
// every task of their child, regardless of who assigned it.
export function listTasksForChild(childId) {
  return db.prepare('SELECT * FROM tasks WHERE child_id = ? ORDER BY due_date, id').all(childId)
}

// FR-M4-06: the assigner's own view, with status, across every child they assigned.
export function listTasksAssignedBy(userId) {
  return db
    .prepare(
      `SELECT t.*, u.name AS child_name FROM tasks t
       JOIN users u ON u.id = t.child_id
       WHERE t.assigned_by = ? ORDER BY t.due_date, t.id`,
    )
    .all(userId)
}

// FR-M4-05: only the task's own child can mark it done.
export function markTaskDone(taskId, childUserId) {
  const task = getTask(taskId)
  if (!task) throw new TaskError(404, 'Task not found')
  if (task.child_id !== childUserId) throw new TaskError(403, 'Forbidden')

  db.prepare("UPDATE tasks SET status = 'done', done_at = datetime('now') WHERE id = ?").run(taskId)
  return getTask(taskId)
}
