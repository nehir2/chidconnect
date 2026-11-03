// Runs before every test file: use a fresh in-memory database, never the real file.
process.env.DB_PATH = ':memory:'
