# State Exam Study Tracker — Specification & Milestone Plan

## 1. Purpose

A personal website for tracking preparation for the FI MU bachelor's state exam in **Programování a vývoj aplikací (PVA)**.

The primary workflow is:

1. Choose an exam topic or one of its mini-tasks.
2. Start studying with a timer.
3. Stop the timer to save a study session.
4. Review time spent, session history, and completed mini-tasks.

The app should make recording study time quick and reliable on both desktop and mobile.

## 2. Confirmed Decisions

| Decision | Specification |
| --- | --- |
| Interface language | English |
| Exam content language | Czech titles and original Czech descriptions |
| Curriculum | 2025/2026 or earlier: 23 topics; exclude **Softwarové inženýrství** |
| Frontend | React + TypeScript |
| Build tooling | Vite |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Database | Supabase Postgres |
| Authentication | Supabase Auth |
| Persistence | Cloud storage, shared across signed-in devices |
| Export/import | Outside the requested scope |

This document defines the implementation plan; it does not indicate that any milestone has already been implemented.

## 3. Scope and Priorities

### Required features

- Preloaded exam topics with their official descriptions and material links.
- Start/stop study timer for a topic or mini-task.
- Complete session history and total study time per topic.
- User-created mini-tasks with completion checkboxes and individual time totals.
- Task time included in the parent topic's total without double-counting.
- Sign-in and persistence across devices.
- English UI and responsive desktop/mobile layouts.

### Proposed first-version additions

These are recommended defaults from the feature discussion, rather than separately confirmed requirements:

- Manually add, edit, and delete sessions to correct forgotten timers.
- Topic readiness ratings, independent of hours studied.
- Topic notes and last-studied indicators.
- A small overview dashboard and search/filter controls.

The milestones include these additions after the core tracking workflow. They can be removed without changing the core architecture.

### Later enhancements

- Exam date and countdown.
- Weekly study-time goals.
- Review queue based on readiness and time since last study.
- Session labels such as Learning, Exercises, Revision, and Mock exam.
- Random topic selection for oral-exam practice.
- Additional resource management and richer notes.
- Charts or a calendar heatmap if they provide useful information beyond the basic totals.

## 4. Official Exam Content

Source: <https://www.fi.muni.cz/studies/fe-bc/bc-pva.html.cs>

Seed a versioned snapshot of the 23 applicable topics. Preserve Czech titles, descriptions, section membership, course references, and source URLs. Do not depend on scraping the university website at app runtime.

Use stable topic IDs based on section and official question number, not editable titles. Store official numbering separately from display order. In the systems section, question 12 is excluded; **Paralelní systémy retains official number 13**.

### Teoretické základy informatiky a matematika

| Official number | Topic |
| --- | --- |
| 1 | Lineární algebra |
| 2 | Základy matematické analýzy |
| 3 | Popisná statistika |
| 4 | Grafy a jejich prohledávání |
| 5 | Grafové algoritmy |
| 6 | Stromové datové struktury |
| 7 | Návrh algoritmů |
| 8 | Funkcionální programování |
| 9 | Regulární jazyky |
| 10 | Rozhodnutelnost |
| 11 | Složitost |

### Programové, výpočetní a informační systémy

| Official number | Topic |
| --- | --- |
| 1 | Podprogramy a objektově orientované programování |
| 2 | Principy nízkoúrovňového programování |
| 3 | Nízkoúrovňové výpočetní architektury |
| 4 | Databáze |
| 5 | SQL, transakce a zpracování dotazů |
| 6 | Operační systémy |
| 7 | Souborové systémy |
| 8 | Sítě |
| 9 | Síťové aplikace a jejich bezpečnost |
| 10 | Základy informační bezpečnosti |
| 11 | Vývoj bezpečných aplikací |
| 13 | Paralelní systémy |

Descriptions and material links remain available inside each topic. Some university material links require an existing university login; the tracker simply links to those resources.

## 5. Pages and Navigation

### Overview — `/`

- Study time today, this week, and overall.
- Topics studied out of 23; a topic is studied once it has a completed session.
- Completed mini-tasks out of all non-archived mini-tasks.
- Recent sessions and a shortcut to resume studying a recent topic.
- Topic time breakdown using a compact list or horizontal bars.
- Clear empty state with a shortcut to the topic list.

### Topics — `/topics`

- All 23 topics grouped by their two official sections.
- Search by Czech topic title, with case- and diacritic-insensitive matching.
- Each entry shows total recorded time, task completion, and last-studied date.
- Show readiness if the proposed readiness feature is implemented.
- Filters for section, not-yet-studied topics, and readiness.
- Start a topic session directly or open the topic detail.

### Topic Detail — `/topics/:topicId`

- Czech title, official question number, description, and material links.
- Total recorded time and the topic's study timer controls.
- Tabs for mini-tasks, sessions, and notes.
- Add, rename, reorder, complete, reopen, or archive mini-tasks.
- Start a session for a specific mini-task.
- Each task shows accumulated recorded time.
- Readiness selector and notes editor if the proposed additions are implemented.

Example mini-tasks under **Grafové algoritmy**:

- Understand Dijkstra's algorithm.
- Work through a shortest-path example.
- Explain when Bellman–Ford is needed.
- Compare Prim's and Kruskal's algorithms.

Tasks are user-created; the example is not automatically seeded as official curriculum content.

### Session History — `/history`

- Sessions ordered newest first, with pagination or incremental loading.
- Date, topic, optional task, start/end times, duration, and optional note.
- Filter by topic, optional task, and date range.
- An active session is visibly distinct from completed records.
- Manual add/edit/delete controls if the correction feature is implemented.
- Confirm deletion and show the recalculated totals after changes.

### Sign-in — `/login`

- Proposed default: email/password through Supabase Auth.
- Sign-in, sign-up, password recovery, and sign-out flows.
- Explain email confirmation when the Supabase project's settings require it.
- Preserve the intended app destination after sign-in.

### Persistent Timer

- A timer bar on every authenticated page whenever a session is running.
- Show current topic, optional task, elapsed time, and Stop.
- Link back to the active topic.
- Use a compact sticky layout on mobile without obscuring controls or content.

## 6. Timer and Session Rules

### Timekeeping

- Store `started_at` and nullable `ended_at` timestamps in UTC.
- A session with `ended_at = null` is active.
- Completed duration is `ended_at - started_at`; do not maintain a separately editable duration column.
- Live elapsed time is derived from the persisted start timestamp and current time.
- Render the timer locally; do not write a counter to the database every second.
- Live sessions use database timestamps for start and stop. Reconcile the display with server time when loading an active session.
- Refreshing, navigation, browser backgrounding, or closing the page must not reset the timer.
- Closing the browser does not stop a session; the user can stop or correct it later.

### Starting and Stopping

- Only one active session is allowed per user, including across devices and tabs.
- Enforce this with a database partial unique index on the user ID for active sessions.
- Starting and stopping use database functions/transactions rather than relying on UI checks alone.
- Start requests carry a stable client-generated session ID so retrying a failed response does not create duplicate sessions.
- Stop requests target the specific active session and are idempotent; repeated requests return the already-recorded end time.
- If another session is running, offer to switch: atomically end the previous session and start the new one at the same server timestamp.
- Stopping saves immediately; adding a session note is optional and must not delay or prevent recording the stop time.
- Stop ends a session. Starting again creates a new session; pause/resume is not required for the first version.
- Completing a task does not implicitly stop its timer; timer controls remain explicit.

### Aggregation

- Every session belongs to exactly one topic and optionally one task within that topic.
- Topic time sums all its completed sessions, including task-linked sessions, exactly once.
- Task time sums completed sessions linked to that task.
- Overall time sums completed sessions, not topic totals plus task totals.
- Display running elapsed time separately from recorded totals until the session is stopped.
- Keep readiness independent from study time and checklist completion.
- Derive last-studied time from the latest completed session, rather than maintaining another editable value.
- Deleting or correcting a session updates all relevant totals and last-studied indicators.

### Manual Corrections

- Manual sessions require a topic and valid start/end timestamps; task and note are optional.
- End must be later than start and cannot be in the future.
- Prevent overlapping sessions for the same user, including overlaps with an active session.
- Adjacent sessions are valid; use half-open time ranges `[start, end)` for overlap checks.
- Apply overlap validation in the database with concurrency protection, not just in the form.
- An active session can have its start corrected or be discarded; it cannot be silently reassigned to another task/topic while running.

### Dates and Time Zones

- Display dates in the user's time zone, initially detected from the browser and saved in their profile.
- Use the saved time zone consistently across devices, with a settings control to change it.
- Use Monday as the start of the study week.
- Daily/weekly totals allocate session time across local date boundaries. A session crossing midnight contributes the appropriate duration to each day.
- Store UTC instants and use timezone-aware boundaries so daylight-saving changes do not alter actual duration.

## 7. Tasks and Readiness

### Mini-tasks

- Required title; completion timestamp, position, and optional archive timestamp.
- Completing/reopening changes checklist state without modifying study history.
- Completed tasks can still be studied again.
- Archive instead of permanently deleting tasks that may be referenced by sessions.
- Archived tasks retain their names and time in historical records, but cannot receive new sessions and are excluded from checklist denominators.
- Stop an active task session before archiving that task.
- Reordering updates task positions without altering their IDs or session links.

### Proposed Readiness Levels

1. Not started — default self-assessment.
2. Learning.
3. Can explain.
4. Exam-ready.

These are explicitly self-assessed labels. Starting a timer does not automatically increase readiness, and completing all tasks does not automatically make a topic exam-ready.

## 8. Data Model

Use migrations and seed data committed alongside the application. Generate TypeScript database types from the actual Supabase schema.

| Table | Main fields | Purpose |
| --- | --- | --- |
| `topics` | `id`, `section`, `official_number`, `display_order`, `title_cs`, `description_cs`, `course_links`, `source_url`, `curriculum_version` | Shared, read-only official topic catalogue |
| `profiles` | `user_id`, `timezone`, `created_at` | Per-user preferences |
| `topic_progress` | `user_id`, `topic_id`, `readiness`, `notes`, `updated_at` | Optional per-user assessment and notes; unique user/topic pair |
| `tasks` | `id`, `user_id`, `topic_id`, `title`, `position`, `completed_at`, `archived_at`, `created_at`, `updated_at` | User-owned mini-tasks |
| `sessions` | `id`, `user_id`, `topic_id`, nullable `task_id`, `started_at`, nullable `ended_at`, `note`, `created_at`, `updated_at` | Active and completed study records |

### Database Guarantees

- User-owned records reference Supabase Auth users.
- Sessions and tasks reference an existing official topic.
- A session's task must belong to the same user and topic; enforce this using composite foreign keys or equivalent database checks.
- Validate non-empty task titles, valid readiness values, and positive completed session durations.
- Enforce one active session per user through a partial unique index.
- Protect against concurrent overlapping inserts/edits, using an exclusion constraint or a per-user transactional locking strategy.
- Index session access by user/start time and user/topic; index task lookup by user/topic/position and task references.
- Do not store cached totals in editable columns for the first version. Use scoped aggregate queries or views/functions, then optimize if measurement warrants it.
- Seed scripts must be repeatable without duplicating topics or replacing user study data.

### Access Control

- Enable Row Level Security on every exposed table.
- Authenticated users can read the shared topic catalogue; ordinary clients cannot edit it.
- Users can only read and modify their own profiles, progress, tasks, and sessions.
- Aggregate functions/views must preserve the same ownership restrictions.
- Prefer invoker-rights database functions. Any privileged function must explicitly authenticate the caller, enforce ownership, and fix its search path.
- The browser uses the Supabase URL and publishable key. No service-role or secret key belongs in frontend code.
- Restrict database grants as well as defining RLS policies.

## 9. Frontend Architecture

Suggested project structure:

```text
src/
  app/                 # Routing, providers, app shell
  components/ui/       # shadcn/ui component source
  components/          # Shared app components
  features/
    auth/
    topics/
    tasks/
    timer/
    sessions/
    overview/
  lib/                 # Supabase client, time helpers, shared utilities
  types/               # Generated database types and domain types
supabase/
  migrations/
  seed.sql
```

- Choose lightweight routing and server-state tooling during foundation setup; they are implementation details rather than additional confirmed stack requirements.
- Use shadcn/ui for buttons, inputs, checkboxes, dialogs, tabs, tables, selects, badges, progress indicators, sheets, confirmation dialogs, and notifications.
- Build the topic views and timer as custom components using those primitives.
- Centralize active-session state so navigation cannot create independent timers.
- Subscribe to current-user session changes for cross-device timer updates; configure Supabase Realtime for the relevant table.
- Refresh authoritative state after mutations, on reconnect, and when the app regains focus. Realtime notifications are an enhancement, not the only recovery mechanism.
- Fetch session history in pages and fetch aggregates separately instead of downloading every session for each screen.
- Use skeleton/loading states, useful empty states, and clear mutation errors.
- Avoid silent offline writes. On a connection failure, retain form input and display Retry; do not claim a session was saved until confirmed.
- Keep the live timer display ticking from its persisted start timestamp during temporary disconnection, while clearly indicating connection state.

## 10. UI and Accessibility

Design direction: a calm, focused study workspace with clear typography, restrained color, and a prominent active timer. Preserve Czech diacritics throughout.

- Responsive layouts for phone, tablet, and desktop.
- English labels, messages, navigation, and form validation.
- Visually distinct topic sections and readable time values.
- Separate signals for recorded time, checklist progress, and readiness.
- Use a list/card representation for history on small screens when tables become difficult to read.
- Keyboard-accessible controls, visible focus indicators, labelled inputs, and accessible dialogs.
- Status must not be conveyed by color alone.
- Respect reduced-motion preferences.
- Avoid screen-reader announcements of the timer on every second.
- Confirm destructive actions; routine start/stop actions stay immediate.
- Light theme first; dark theme is a later enhancement unless explicitly requested.

## 11. Implementation Milestones

Milestones are ordered by dependency. Each milestone is complete only when its acceptance criteria have been verified.

### Milestone 1 — Project Foundation

- [ ] Scaffold React + TypeScript with Vite.
- [ ] Configure Tailwind CSS and shadcn/ui with shared design tokens.
- [ ] Set up navigation, feature folders, and responsive app shell.
- [ ] Add environment-variable examples, Supabase client configuration, and setup instructions.
- [ ] Configure type-checking, linting, and production build commands.

**Acceptance criteria**

- The app starts locally and produces a successful production build.
- Core navigation works at desktop and mobile sizes.
- Direct loading of a nested route works with the deployment's SPA fallback configuration.
- Missing backend configuration produces an actionable setup message.

### Milestone 2 — Database, Authentication, and Curriculum

- [ ] Create schema migrations, constraints, indexes, grants, and RLS policies.
- [ ] Seed the 23 official topics, descriptions, and material links.
- [ ] Implement sign-in, sign-up, sign-out, email-confirmation handling, and password recovery.
- [ ] Create the profile and saved timezone preference.
- [ ] Generate database types and implement authenticated route handling.

**Acceptance criteria**

- Exactly 23 applicable topics exist: 11 theory/math and 12 systems topics.
- Softwarové inženýrství is absent; Paralelní systémy keeps official number 13.
- Seed reruns do not duplicate topics.
- Two test users cannot access or mutate each other's data, including through aggregate endpoints.
- Login survives a reload, and password recovery works with configured redirect URLs.

### Milestone 3 — Topics and Mini-tasks

- [ ] Implement grouped topic list, search, and topic details.
- [ ] Show official descriptions and material links.
- [ ] Implement task creation, editing, reordering, completion, reopening, and archiving.
- [ ] Show task counts and empty states.

**Acceptance criteria**

- All 23 topics can be found and opened.
- Search supports Czech diacritics and diacritic-free input.
- Task changes persist after refresh and on a second signed-in device.
- Archiving preserves session references and excludes the task from active checklists.

### Milestone 4 — Reliable Timer and Core Totals

- [ ] Implement transactional start/stop/switch database functions.
- [ ] Enforce active-session uniqueness and retry-safe operations.
- [ ] Build persistent timer controls and topic/task start actions.
- [ ] Restore running sessions on app load and configure cross-device updates.
- [ ] Display recorded time per topic/task and overall, with active elapsed time shown separately.

**Acceptance criteria**

- A session can run directly under a topic or under one of its tasks.
- Navigation, reload, and tab backgrounding do not reset elapsed time.
- Concurrent starts from two devices leave exactly one active session.
- Repeating a start/stop request does not duplicate or extend recorded sessions.
- Switching stops the old session and starts the new one atomically.
- Task-linked time contributes to the topic and overall totals exactly once.
- Connection failures are visible and can be reconciled/retried without losing or duplicating a session.

### Milestone 5 — Session History and Corrections

- [ ] Implement paginated session history and topic-specific history.
- [ ] Add topic/task/date filters and session notes.
- [ ] Implement the proposed manual add/edit/delete controls.
- [ ] Implement database-enforced overlap validation and active-session corrections.
- [ ] Recalculate displayed aggregates after every correction.

**Acceptance criteria**

- Every recorded session is discoverable in global and topic history.
- Manual sessions update task/topic/overall totals correctly.
- Invalid durations, future end times, and overlapping sessions are rejected.
- Adjacent sessions are accepted.
- Deleting the most recent session updates totals and last-studied dates.
- Archived task names remain available in old session records.

### Milestone 6 — Overview and Study Organization

- [ ] Implement today/this-week/all-time overview totals and recent sessions.
- [ ] Add topic time breakdown and checklist completion summaries.
- [ ] Implement proposed readiness ratings, notes, and last-studied indicators.
- [ ] Add readiness/not-yet-studied filters and timezone settings.
- [ ] Implement timezone-aware daily/weekly duration allocation.

**Acceptance criteria**

- Overview values agree with session history and topic totals.
- Sessions spanning midnight or a week boundary contribute time to the correct periods.
- Daylight-saving transitions preserve actual elapsed duration.
- Readiness and notes persist independently of recorded hours or completed tasks.
- New users get useful empty states rather than misleading progress values.

### Milestone 7 — Verification and Deployment

- [ ] Verify keyboard navigation, focus handling, mobile layouts, and timer-bar placement.
- [ ] Run type-checking, linting, production build, and targeted automated checks.
- [ ] Exercise real Supabase transactions and RLS with separate test users.
- [ ] Verify two-tab/device timer behavior and connection-loss recovery.
- [ ] Deploy the frontend to a static host with SPA route fallback.
- [ ] Configure Supabase auth site URL, allowed redirects, and Realtime publication.
- [ ] Document installation, migration/seed application, environment variables, and deployment.

**Acceptance criteria**

- All preceding milestones meet their acceptance criteria.
- The deployed app supports sign-in, task creation, start/stop, and history on phone and desktop.
- Password recovery and session restoration work on the deployed origin.
- Data ownership and concurrency checks pass against the actual database.
- The repository contains no private credentials.

## 12. Focused Verification Plan

Prioritize meaningful checks around data integrity and timekeeping:

- **Database integration:** RLS isolation, same-owner/topic task links, concurrent active-session starts, idempotent stops, atomic switching, overlap rejection, and repeatable seeding.
- **Time calculations:** task rollups, no double-counting, manual corrections, active vs. completed totals, midnight/week splits, and daylight-saving boundaries.
- **End-to-end flow:** sign in → open topic → add task → start → reload → stop → inspect history → correct session → verify totals.
- **Cross-device flow:** start in one tab/device, observe in another, stop there, and reconcile the first device.
- **UI checks:** empty/loading/error states, keyboard operation, and phone-sized layouts.

Use a development/test Supabase project and disposable study records for verification.

## 13. Setup Inputs and Completion Definition

Before backend integration, the user supplies/configures a Supabase project. The application requires its project URL and publishable key in local/deployment environment variables; privileged credentials are not needed in the browser.

Implementation defaults to confirm or adjust when work begins:

- Email/password authentication.
- Light-theme-first design.
- Proposed additions: manual session correction, readiness, notes, and overview.
- Frontend hosting provider.

The first version is complete when the user can sign in, study any of the 23 topics or their mini-tasks, reliably record time across devices, check off tasks, inspect every session, and see accurate per-task/per-topic totals in a responsive English interface.
