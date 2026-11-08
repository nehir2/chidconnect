# Test Team Meeting Notes – Weeks 4–5

**Project:** ChildConnect (SENG 383)
**Jira project:** SCRUM
**Team:** Sıla Yıldız, Nehir Arseven, Yiğit Zümbüloğlu
**Sprint:** Sprint 1 (Weeks 3–6, 14.10 – 08.11.2026)

---

## Week 4 (19–25 October 2026)

### Meeting

| | |
|---|---|
| **Date** | 19.10.2026 |
| **Format** | in person |
| **Team** | Sıla Yıldız, Nehir Arseven, Yiğit Zümbüloğlu |


### Agenda

1. First draft of the Software Requirements Specification (`docs/SRS.md`)
2. Project Management Plan, section 1 (PMP-1): project, Jira setup, team and roles

### Work done this week

- The first draft of the SRS and the PMP document were created and committed to the repository on 24 October (pull request #1, reviewed and merged).
- The SRS describes the eight mandatory modules M1–M8. The test team derives its test cases from the acceptance criteria in this document.
- PMP-1 records the project in one sentence, the Jira project key (SCRUM), the board link, and the roles of the three team members:
  - Sıla Yıldız: M1 Login and roles, M2 Linking specialists, M7 Weekly statistics; PMP owner; CI and README
  - Nehir Arseven: M3 Weekly schedule, M5 Specialist entries, M6 Documents; SRS owner; test team contact
  - Yiğit Zümbüloğlu: M4 Tasks, M8 Role-based AI summary; design document owner; walking skeleton



## Week 5 (26 October – 1 November 2026)

### Meeting

| | |
|---|---|
| **Date** | 26.10.2026|
| **Format** |  in person  |
| **Team** | Sıla Yıldız, Nehir Arseven, Yiğit Zümbüloğlu |


### Agenda

1. Plan for the walking skeleton (v0.0): React page → Express API → SQLite
2. First API test and the GitHub Actions CI run
3. PMP section 2 (PMP-2): work packages (epics) and sprint plan
4. Task distribution for the work due on 8 November
5. SRS and SDD first versions

### Work done this week

- **Task distribution (29 October).** 

  | Person | Work due on 8 November | Jira |
  |---|---|---|
  | Sıla | PMP-2: epic table and sprint plan | SCRUM-22 |
  | Sıla | First test and GitHub Actions CI | SCRUM-34 |
  | Sıla | README and `v0.0` tag | SCRUM-35 |
  | Sıla | SDD: module rows for M1, M2, M7 | SCRUM-24 |
  | Nehir | Open `docs/SDD.md`: ER diagram and UI wireframes | SCRUM-28 |
  | Nehir | SDD: module rows for M3, M5, M6 | SCRUM-29 |
  | Nehir | Review the SRS and close it as the first version | SCRUM-26, 27 |
  | Yiğit | Walking skeleton: React, Express and SQLite code | SCRUM-31, 32, 33 |
  | Yiğit | SDD: architecture diagram, API table, sequence diagrams | SCRUM-36 |
  | Yiğit | SRS: review M4 and M8 | SCRUM-37 |

- **Dependencies.** Sıla's CI and `v0.0` tasks can only be finished after Yiğit's walking skeleton code is merged into `main`. In the SDD, Nehir opens the file first; Sıla and Yiğit then add their own sections.
- **Walking skeleton.** The React and Vite frontend setup (M4) was committed on 1 November.
- **SDD.** `docs/SDD.md` was created and the seven UI wireframes were added on 1 November (SCRUM-28, branch `SCRUM-28-sdd-skeleton`).
- **PMP-2.** The work packages (epics) are assigned to owners and mapped to Sprint 1–3, and the four-sprint plan is written in `docs/PMP.md`. Sprint 1 ends with the walking skeleton (v0.0).

### Decisions

- The walking skeleton is a minimal end-to-end slice: the React page calls `GET /api/tasks` on the Express backend, which reads one seeded task from SQLite.
- Every change goes into `main` through a reviewed pull request, and each task has its own Jira issue.

### Action items

| # | Action | Owner | Jira | Due |
|---|---|---|---|---|
| 1 | Open `docs/SDD.md` with ER diagram and UI wireframes | Nehir | SCRUM-28 | 2026-11-08 |
| 2 | SDD module rows for M3, M5, M6 | Nehir | SCRUM-29 | 2026-11-08 |
| 3 | Review the SRS and close it as the first version | Nehir | SCRUM-26, 27 | 2026-11-08 |
| 4 | Walking skeleton code | Yiğit | SCRUM-31, 32, 33 | 2026-11-08 |
| 5 | SDD architecture diagram, API table, sequence diagrams | Yiğit | SCRUM-36 | 2026-11-08 |
| 6 | SRS review of M4 and M8 | Yiğit | SCRUM-37 | 2026-11-08 |
| 7 | PMP-2: epic table and sprint plan | Sıla | SCRUM-22 | 2026-11-08 |
| 8 | First API test and GitHub Actions CI | Sıla | SCRUM-34 | 2026-11-08 |
| 9 | README and `v0.0` tag | Sıla | SCRUM-35 | 2026-11-08 |
| 10 | SDD module rows for M1, M2, M7 | Sıla | SCRUM-24 | 2026-11-08 |


---

