import TaskList from './TaskList.jsx'

// Each role gets its own home screen (FR-M1-07).
// Parent and specialist screens are filled in by M2 (linking) and M3 (tasks).

export function ParentHome({ user, token }) {
  return (
    <section data-testid="parent-home">
      <p className="subtitle">Parent dashboard</p>
      <p>Welcome, {user.name}. Your children and their weekly plan will appear here.</p>
      <h2 className="section-title">Tasks</h2>
      <TaskList token={token} />
    </section>
  )
}

export function SpecialistHome({ user }) {
  return (
    <section data-testid="specialist-home">
      <p className="subtitle">Specialist home</p>
      <p>Welcome, {user.name}. The children linked to you will appear here.</p>
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
