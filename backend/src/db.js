import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')

// DB_PATH lets tests use an in-memory database (DB_PATH=:memory:).
const dbPath = process.env.DB_PATH || join(dataDir, 'chidconnect.sqlite')
if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)

db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('parent', 'specialist', 'child')),
    parent_id INTEGER REFERENCES users(id)
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    development_area TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
  )
`)

// M2: a specialist can see a child's data only while a link row exists (FR-M2-06).
db.exec(`
  CREATE TABLE IF NOT EXISTS specialist_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialist_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (child_id, specialist_id)
  )
`)
