import { AiError, buildPrompt, generateWeeklySummary } from '../src/ai.js'

const records = [
  { type: 'task', id: 1, date: '2026-11-07', text: 'Practice counting to 20', area: 'Cognitive' },
  { type: 'entry', id: 2, date: '2026-11-08', text: 'Focused well during group activity', area: 'Social' },
]

describe('generateWeeklySummary in mock mode (FR-M8-01, FR-M8-04, FR-M8-06)', () => {
  test('runs without an API key and labels the summary "AI-generated"', async () => {
    const res = await generateWeeklySummary({ role: 'parent', records })
    expect(res.label).toBe('AI-generated')
    expect(typeof res.text).toBe('string')
    expect(res.text.length).toBeGreaterThan(0)
  })

  test('links to every source record it was given', async () => {
    const res = await generateWeeklySummary({ role: 'parent', records })
    expect(res.sourceRecordIds).toEqual(['task#1', 'entry#2'])
  })

  test('a week with no records gives a graceful message, not an empty summary', async () => {
    const res = await generateWeeklySummary({ role: 'specialist', records: [] })
    expect(res.sourceRecordIds).toEqual([])
    expect(res.text.toLowerCase()).toContain('no records')
  })
})

describe('buildPrompt (FR-M8-02, FR-M8-05)', () => {
  test('the parent and the specialist get a different prompt for the same records', () => {
    expect(buildPrompt('parent', records)).not.toEqual(buildPrompt('specialist', records))
  })

  test('every prompt instructs the model not to diagnose, decide or suggest treatment', () => {
    for (const role of ['parent', 'specialist']) {
      const prompt = buildPrompt(role, records)
      expect(prompt).toMatch(/diagnos/i)
      expect(prompt).toMatch(/treatment/i)
      expect(prompt).toMatch(/suggestion/i)
    }
  })

  test('the prompt includes every given record', () => {
    const prompt = buildPrompt('parent', records)
    expect(prompt).toContain('Practice counting to 20')
    expect(prompt).toContain('Focused well during group activity')
  })
})

describe('when no provider is configured and mock mode is off (FR-M8-07)', () => {
  test('fails as an AiError instead of throwing an unhandled error', async () => {
    const originalMode = process.env.AI_MODE
    delete process.env.AI_MODE
    process.env.AI_API_KEY = 'fake-key-for-test'

    try {
      await expect(generateWeeklySummary({ role: 'parent', records: [] })).rejects.toBeInstanceOf(AiError)
    } finally {
      process.env.AI_MODE = originalMode
      delete process.env.AI_API_KEY
    }
  })
})
