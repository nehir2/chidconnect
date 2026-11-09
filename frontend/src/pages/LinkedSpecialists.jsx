import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../api.js'

const TYPES = ['teacher', 'psychologist', 'doctor', 'special education teacher', 'coach']

// Parent: list, link and unlink the specialists of one child (FR-M2-01 … FR-M2-04, FR-M2-07).
function LinkedSpecialists({ child, token }) {
  const [specialists, setSpecialists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')
  const [type, setType] = useState(TYPES[0])
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(() => {
    return apiFetch(`/api/children/${child.id}/specialists`, { token })
      .then((data) => {
        setSpecialists(data)
        setError(null)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [child.id, token])

  useEffect(() => {
    load()
  }, [load])

  async function handleLink(event) {
    event.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      await apiFetch(`/api/children/${child.id}/specialists`, {
        token,
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), type }),
      })
      setEmail('')
      await load()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUnlink(specialistId) {
    try {
      await apiFetch(`/api/children/${child.id}/specialists/${specialistId}`, {
        token,
        method: 'DELETE',
      })
      setConfirmId(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="panel" data-testid="linked-specialists">
      <h3>Specialists of {child.name}</h3>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && specialists.length === 0 && <p>No specialists linked yet.</p>}

      {specialists.length > 0 && (
        <ul className="plain-list">
          {specialists.map((s) => (
            <li key={s.id} className="list-row">
              <div>
                <strong>{s.name}</strong> <span className="muted">· {s.type}</span>
                <div className="muted small">{s.email}</div>
              </div>
              {confirmId === s.id ? (
                <div className="row-actions">
                  <span className="small">Unlink {s.name}?</span>
                  <button type="button" className="danger-button" onClick={() => handleUnlink(s.id)}>
                    Yes, unlink
                  </button>
                  <button type="button" className="link-button" onClick={() => setConfirmId(null)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" className="link-button" onClick={() => setConfirmId(s.id)}>
                  Unlink
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form className="inline-form" onSubmit={handleLink}>
        <h4>Link a specialist</h4>
        <label>
          Specialist email
          <input
            type="email"
            name="specialist-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Type
          <select name="specialist-type" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {formError && (
          <p className="error" role="alert">
            {formError}
          </p>
        )}
        <button type="submit" disabled={saving}>
          {saving ? 'Linking…' : 'Link specialist'}
        </button>
      </form>
    </div>
  )
}

export default LinkedSpecialists
