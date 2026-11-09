import { useEffect, useState } from 'react'
import { apiFetch } from '../api.js'

// Parent: own children. Specialist: linked children (FR-M2-05).
export function useMyChildren(token) {
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    apiFetch('/api/me/children', { token })
      .then((data) => {
        if (!cancelled) setChildren(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return { children, loading, error }
}
