# Software Requirements Specification (SRS)

**Team name:** ChildConnect
**Version:** ☒ First version (draft) ☐ Final (Week 10)
**Last updated:** 2026-10-24

---

## 1. Introduction

**Purpose of the system:**
ChildConnect is a web-based decision support platform that brings the people involved in a child's development (parents and specialists such as teachers, psychologists, doctors, special education teachers and coaches) around one shared weekly schedule, task list and record of observations. An AI component summarizes the records of a week for each reader according to the reader's role. The AI supports decisions; it never makes them: every summary is shown as a suggestion together with the records it is based on, and a human decides.

**Users of the system:**

| User type | Description |
|---|---|
| Parent | Owns the child's data, sees all records of the child, and links or unlinks specialists. |
| Specialist | Teacher, psychologist, doctor, special education teacher or coach. Works only with the children they are linked to; an unlinked specialist can access no data about the child. |
| Child | Sees only their own tasks and schedule, and marks tasks as done. |

**Scope:** Release 1.0 covers modules M1–M8 below. Optional extensions (monthly views, recurring tasks, edit history, per-document sharing, AI task suggestions, notifications) have priority *Could* and are built only after M1–M8 pass the test team's tests. Out of scope: field-level permissions, e-mail invitations, an admin panel, mobile apps, cloud deployment, microservices and Docker.

**Constraints:**

| ID | Constraint |
|---|---|
| C-1 | The system is built with React (Vite), Node.js + Express, SQLite and JWT authentication. |
| C-2 | The AI component uses the Gemini API or GitHub Models through a single backend module, with a mock mode for tests and CI. |
| C-3 | The application runs locally by following the README; no cloud deployment. |
| C-4 | Only synthetic data created by the seed script is used. |
| C-5 | The AI only summarizes; it never makes decisions or suggests a diagnosis or treatment. |

---

## 2. Functional Requirements

Priority: **Must** (required for v1.0) / **Should** (planned) / **Could** (if time allows).

### M1 – Login and roles

| ID | Requirement | Priority |
|---|---|---|
| FR-M1-01 | The system shall allow a registered user to log in with email and password. | Must |
| FR-M1-02 | The system shall reject a login with a wrong email or password and show an error message that does not reveal which of the two was wrong. | Must |
| FR-M1-03 | The system shall issue a signed JWT with an expiry time after a successful login; the token shall contain no password and no child records. | Must |
| FR-M1-04 | The system shall take the user's role (parent, specialist, child) from the account; the user shall not choose a role at login. | Must |
| FR-M1-05 | The system shall show each role only its own screens: the parent dashboard for parents, the linked children list for specialists, and the task screen for children. | Must |
| FR-M1-06 | The API shall return 401 for requests without a valid token and 403 for requests to an endpoint the user's role is not allowed to use. | Must |
| FR-M1-07 | The system shall allow the user to log out, removing the token from the client. | Should |

### M2 – Linking specialists

| ID | Requirement | Priority |
|---|---|---|
| FR-M2-01 | The parent shall be able to link a registered specialist to their child by entering the specialist's email and type (teacher, psychologist, doctor, special education teacher, coach). | Must |
| FR-M2-02 | The system shall show an error when the entered email does not belong to a registered specialist. | Must |
| FR-M2-03 | The parent shall be able to list the specialists linked to their child. | Must |
| FR-M2-04 | The parent shall be able to unlink a specialist after confirming the action. | Must |
| FR-M2-05 | A specialist shall see the list of children they are currently linked to. | Must |
| FR-M2-06 | For every API request about a child, the backend shall check the current specialist–child link; an unlinked specialist shall receive 403 even if their JWT has not expired. | Must |
| FR-M2-07 | The system shall prevent linking the same specialist to the same child twice. | Should |

### M3 – Weekly schedule

| ID | Requirement | Priority |
|---|---|---|
| FR-M3-01 | The parent and linked specialists shall be able to add an event for the child with a title, date, start time and end time. | Must |
| FR-M3-02 | The system shall list the child's events for a selected week (Monday–Sunday) in a weekly view. | Must |
| FR-M3-03 | The user shall be able to move to the previous and next week in the weekly view. | Must |
| FR-M3-04 | The child shall see their own events in read-only form. | Must |
| FR-M3-05 | The system shall reject an event whose end time is not after its start time. | Must |
| FR-M3-06 | The user who created an event shall be able to edit or delete it. | Should |

### M4 – Tasks

| ID | Requirement | Priority |
|---|---|---|
| FR-M4-01 | The parent and linked specialists shall be able to assign a task to the child with a title, description, development area and due date. | Must |
| FR-M4-02 | The system shall reject a task without a title, development area or due date. | Must |
| FR-M4-03 | The development area shall be chosen from a fixed list (Language, Motor, Social, Cognitive, Self-care). | Must |
| FR-M4-04 | The child shall see only their own tasks. | Must |
| FR-M4-05 | The child shall be able to mark a task as done. | Must |
| FR-M4-06 | The assigner shall see the tasks they assigned, with the status of each task (pending / done). | Must |
| FR-M4-07 | The parent shall see all tasks of their child, regardless of who assigned them. | Must |

### M5 – Specialist entries

| ID | Requirement | Priority |
|---|---|---|
| FR-M5-01 | A linked specialist shall be able to add a dated observation about the child. | Must |
| FR-M5-02 | The author shall be able to edit their own entry; an edited entry shall be shown with an "edited" mark. | Must |
| FR-M5-03 | A specialist shall not be able to edit entries written by another user. | Must |
| FR-M5-04 | The parent and linked specialists shall see the child's entries in date order. | Must |
| FR-M5-05 | The child shall not be able to see entries; the API shall return 403 to a child requesting them. | Must |

### M6 – Documents

| ID | Requirement | Priority |
|---|---|---|
| FR-M6-01 | The parent and linked specialists shall be able to upload a PDF or image file (JPG, PNG) for the child. | Must |
| FR-M6-02 | The system shall reject other file types and files larger than 10 MB. | Must |
| FR-M6-03 | The system shall list the child's documents with name, type, uploader and upload date. | Must |
| FR-M6-04 | Users linked to the child shall be able to view and download a document. | Must |
| FR-M6-05 | The child shall not see documents; the API shall return 403 to a child requesting them. | Must |

### M7 – Weekly statistics

| ID | Requirement | Priority |
|---|---|---|
| FR-M7-01 | The system shall compute the task completion rate for a selected week as the number of completed tasks divided by the number of tasks due in that week. | Must |
| FR-M7-02 | The system shall show the completion rate in total and separately for each development area. | Must |
| FR-M7-03 | When the selected week has no tasks, the system shall show "No tasks this week" instead of a rate. | Must |
| FR-M7-04 | The statistics shall be calculated by application code, not by the AI component. | Must |
| FR-M7-05 | The parent and linked specialists shall see the statistics; the child shall not. | Should |

### M8 – Role-based AI summary

| ID | Requirement | Priority |
|---|---|---|
| FR-M8-01 | The parent and linked specialists shall be able to request a summary of the selected week's records. | Must |
| FR-M8-02 | The system shall use a separate prompt for the parent and for the specialist. | Must |
| FR-M8-03 | The backend shall send the AI service only the records the requesting user is allowed to see. | Must |
| FR-M8-04 | The summary shall be labelled "AI-generated" and shall show links to the source records it is based on. | Must |
| FR-M8-05 | The prompt shall instruct the AI not to make decisions, diagnose or suggest treatment; the summary shall be presented as a suggestion only. | Must |
| FR-M8-06 | All AI calls shall go through a single backend module that has a mock mode used in tests and CI. | Must |
| FR-M8-07 | If the AI service fails, the system shall show an error message and the rest of the application shall keep working. | Must |
| FR-M8-08 | The AI provider's API key shall be stored only in the backend's environment variables and never in the frontend or in Git. | Must |

---

## 3. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Main pages load in under 2 seconds on a local machine with the seed data. |
| NFR-02 | Performance | With the real AI provider, a weekly summary is returned within 5 seconds; in mock mode immediately. |
| NFR-03 | Security | Passwords are stored hashed with bcrypt and are never returned by the API. |
| NFR-04 | Security | Role and specialist–child link checks are enforced in the backend on every API endpoint, not only by hiding elements in the UI. |
| NFR-05 | Privacy | Only synthetic data created by the seed script is used; no real personal data at any stage. |

---

## 4. Critical Flows and Acceptance Criteria

| Flow | Related requirements | Acceptance criteria |
|---|---|---|
| Flow 1: Specialist assigns a task, child completes it | FR-M4-01, FR-M4-05, FR-M4-06, FR-M2-06 | **Given** a specialist linked to a child is logged in, **When** the specialist assigns the task "Read for 20 minutes" and the child logs in and marks it as done, **Then** the specialist sees the task with status "done". |
| Flow 2: Parent unlinks a specialist | FR-M2-04, FR-M2-05, FR-M2-06 | **Given** a specialist linked to a child is logged in, **When** the parent unlinks the specialist, **Then** the child no longer appears in the specialist's list and the specialist's next request about the child returns 403. |
| Flow 3: Parent gets the weekly AI summary | FR-M8-01, FR-M8-03, FR-M8-04, FR-M8-06 | **Given** a week with tasks and observations and the AI module in mock mode, **When** the parent requests the weekly summary, **Then** a summary labelled "AI-generated" is shown with links to its source records. |

---

## 5. Use Case Diagram (optional)

*To be added in the final version.*

---

## 6. Change Log

| Date | Change | By |
|---|---|---|
| 2026-10-24 | First version (draft): introduction, scope, NFRs, critical flows | Nehir Arseven |
| 2026-10-24 | Converted to course template; tech stack aligned with assignment (SQLite, Gemini/GitHub Models); testable requirements for M1–M8 added | Sıla Yıldız |
