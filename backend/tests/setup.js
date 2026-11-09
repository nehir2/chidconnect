// Runs before every test file: use a fresh in-memory database, never the real file,
// and a fixed JWT secret for tests only.
process.env.DB_PATH = ':memory:'
process.env.JWT_SECRET = 'test-secret'
