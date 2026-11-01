# seng-383

ChildConnect — see [docs/SRS.md](docs/SRS.md) and [docs/PMP.md](docs/PMP.md).

## Walking skeleton (v0.0)

Minimal end-to-end slice: the React page calls `GET /api/tasks` on the Express
backend, which reads one seeded task from SQLite.

### Backend

```bash
cd backend
npm install
npm run seed   # creates backend/data/chidconnect.sqlite and inserts one sample task
npm start       # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

Start the backend first, then the frontend, and open http://localhost:5173 —
it should list the seeded task. The frontend calls the backend at
`http://localhost:4000` by default; override with a `VITE_API_URL` env var if
the backend runs on a different host/port.
