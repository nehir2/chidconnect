import LinkedSpecialists from './LinkedSpecialists.jsx'
import TaskList from './TaskList.jsx'
import { useMyChildren } from './useMyChildren.js'

// Each role gets its own home screen (FR-M1-07).
// M2 adds linked specialists (parent) and linked children (specialist).

export function ParentHome({ user, token }) {
  const { children, loading, error } = useMyChildren(token)
  return (
    <section data-testid="parent-home">
      <p className="subtitle">Parent dashboard</p>
      <p>Welcome, {user.name}.</p>

      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {children.map((child) => (
        <LinkedSpecialists key={child.id} child={child} token={token} />
      ))}

      <h2 className="section-title">Tasks</h2>
      <TaskList token={token} />
    </section>
  )
}

export function SpecialistHome({ user, token }) {
  const { children, loading, error } = useMyChildren(token)
  return (
    <section data-testid="specialist-home">
      <p className="subtitle">Specialist home</p>
      <p>Welcome, {user.name}.</p>

      <h2 className="section-title">My children</h2>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && children.length === 0 && (
        <p>You are not linked to any child yet. A parent can link you with your email.</p>
      )}
      {children.length > 0 && (
        <ul className="plain-list" data-testid="my-children">
          {children.map((child) => (
            <li key={child.id} className="list-row panel">
              <strong>{child.name}</strong>
              <span className="muted">{child.type}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function ChildHome({ user, token }) {
  return (
    <section data-testid="child-home">
      <p className="subtitle">My tasks</p>
      <p>Hi {user.name}! Here is what to do this week.</p>
      <TaskList token={token} />
    </section>
  )
}

const HOMES = {
  parent: ParentHome,
  specialist: SpecialistHome,
  child: ChildHome,
}

export function RoleHome({ user, token }) {
  const Home = HOMES[user.role]
  if (!Home) return <p className="error">Unknown role: {user.role}</p>
  return <Home user={user} token={token} />
}
