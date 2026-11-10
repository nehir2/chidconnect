// FR-M8-06: every AI call in the app goes through this module — nothing else
// talks to an AI provider directly. The provider is not chosen yet (SRS
// constraint C-2: Gemini API or GitHub Models); until it is, `callProvider`
// below is the only piece that needs a real implementation. Until then (and
// always in tests and CI) the module runs in mock mode and needs no API key.

// FR-M8-05: every prompt, whichever provider ends up sending it, carries this instruction.
const SAFETY_INSTRUCTION =
  "Summarize only the records provided below. Do not diagnose any condition, do not decide " +
  "anything on the family's behalf, and do not suggest a treatment. Present this as a " +
  'suggestion for a human to review, not as a conclusion.'

// FR-M8-02: a different prompt for a parent and for a specialist reading the same records.
export function buildPrompt(role, records) {
  const audience =
    role === 'specialist'
      ? "a specialist (teacher, psychologist, doctor, special education teacher or coach) working with this child"
      : "the child's parent"

  const recordsText = records.length
    ? records.map((r) => `- [${r.type}#${r.id}] ${r.date}: ${r.text}`).join('\n')
    : '(no records for this week)'

  return [
    `You are writing a short weekly summary for ${audience}.`,
    SAFETY_INSTRUCTION,
    "This week's records:",
    recordsText,
  ].join('\n\n')
}

// AI_MODE=mock (set for every test run in tests/setup.js, and meant to stay set in CI)
// skips the provider entirely. Without a real AI_API_KEY we also fall back to mock mode,
// so the app never crashes just because no provider has been configured yet.
function isMockMode() {
  return process.env.AI_MODE === 'mock' || !process.env.AI_API_KEY
}

function mockSummary(role, records) {
  if (records.length === 0) {
    return `No records were logged this week, so there is no summary for ${role === 'specialist' ? 'this specialist' : 'the parent'} yet.`
  }
  const areas = [...new Set(records.map((r) => r.area).filter(Boolean))]
  const areaText = areas.length ? ` touching ${areas.join(', ')}` : ''
  return (
    `[mock summary for ${role}] This week has ${records.length} record(s)${areaText}. ` +
    'This is a suggestion only, not a diagnosis or a treatment recommendation.'
  )
}

// The seam a real provider plugs into once one is chosen (C-2). Not implemented yet.
async function callProvider(/* prompt */) {
  throw new Error('No AI provider is configured (AI_MODE is not "mock" and no AI_API_KEY is set)')
}

// FR-M8-07: a provider failure becomes this error, not a crash; routes can
// catch it and show a message while the rest of the app keeps working.
export class AiError extends Error {
  constructor(message) {
    super(message)
    this.status = 502
  }
}

// FR-M8-01, FR-M8-03, FR-M8-04: `records` must already be filtered by the
// caller to only what the requesting user is allowed to see.
export async function generateWeeklySummary({ role, records }) {
  const prompt = buildPrompt(role, records)

  let text
  if (isMockMode()) {
    text = mockSummary(role, records)
  } else {
    try {
      text = await callProvider(prompt)
    } catch {
      throw new AiError('The AI summary is not available right now. Please try again later.')
    }
  }

  return {
    label: 'AI-generated',
    text,
    sourceRecordIds: records.map((r) => `${r.type}#${r.id}`),
  }
}
