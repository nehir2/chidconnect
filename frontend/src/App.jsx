import { useEffect, useState } from 'react'
import './App.css'
import { apiFetch, loadToken, saveToken } from './api.js'
import LoginPage from './pages/LoginPage.jsx'
import { RoleHome } from './pages/RoleHome.jsx'

function App() {
  const [token, setToken] = useState(() => loadToken())
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(() => Boolean(loadToken()))

  // On page load, restore the session from the stored token.
  useEffect(() => {
    if (!token || user) return
    let cancelled = false

    apiFetch('/api/auth/me', { token })
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch(() => {
        // expired or invalid token → back to the login page
        if (!cancelled) {
          saveToken(null)
          setToken(null)
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, user])

  async function handleLogin(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    saveToken(data.token)
    setToken(data.token)
    setUser(data.user)
  }

  function handleLogout() {
    saveToken(null)
    setToken(null)
    setUser(null)
  }

  if (checking) {
    return (
      <main className="page">
        <p>Loading…</p>
      </main>
    )
  }

  if (!token || !user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <main className="page">
      <header className="app-header">
        <h1>ChildConnect</h1>
        <div className="user-box">
          <span className="role-badge">{user.role}</span>
          <button type="button" className="link-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <RoleHome user={user} token={token} />
    </main>
  )
}

export default App
