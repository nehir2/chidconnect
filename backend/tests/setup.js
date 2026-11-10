// Runs before every test file: use a fresh in-memory database, never the real file,
// a fixed JWT secret for tests only, and the AI module's mock mode (FR-M8-06) so
// the suite and CI never need a real provider or API key.
process.env.DB_PATH = ':memory:'
process.env.JWT_SECRET = 'test-secret'
process.env.AI_MODE = 'mock'
