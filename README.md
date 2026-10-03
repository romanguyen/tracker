# Study Ledger

A study tracker for the FI MU PVA bachelor's state exam. The interface is in English and preserves the official Czech topic names. The detailed feature, database, and milestone plan is in [SPEC.md](./SPEC.md).

## Status

**All seven milestones are complete and verified live** against a real
Supabase project: accessibility/keyboard flow, mobile layouts, two-user RLS
isolation, concurrency + realtime, timezone-aware aggregates, and
connection-loss recovery (bounded request timeouts, friendly errors, and
zero duplicate rows on retry).

Verification stack: `npm run lint`, `npm run typecheck`, `npm run build`,
plus browser-driven end-to-end runs on the production build.

## Current milestone

**Milestone 7 — Verification and Deployment**

The tracker is feature-complete across all seven milestones:

- Foundation, Supabase schema + RLS, 23-topic Czech seed, email/password auth
- Mini-tasks, reliable cross-device timer, session history with corrections
- Overview dashboard with timezone-aware daily/weekly totals, readiness, and notes
- Catppuccin Latte/Mocha theme with a light/dark toggle
- Mini-task deletion (with unlink guarantees) and pinned links/files per topic
- **Pomodoro rounds**: planned focus sessions with countdowns and exact clamped completion, breaks that never count as study time, and per-device focus/break settings (migration: `20261010090000_pomodoro.sql`)

### Static-host deployment

The production build is a static SPA. Both common setups are preconfigured:
`vercel.json` (Vercel) and `public/_redirects` (Netlify/Cloudflare Pages)
route every path to `/index.html`.

**Vercel (recommended):**

```bash
npm run build
npx vercel --prod
```

In the Vercel project settings, add the same environment variables as
`.env.local`:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

**Netlify (no git needed):** run `npm run build`, then drag the `dist/`
folder into <https://app.netlify.com/drop>. Add the same two environment
variables under **Site configuration → Environment variables** and redeploy.

### Supabase — production URL configuration

Once you know the deployed origin (e.g. `https://study-ledger.vercel.app`):

1. **Authentication → URL Configuration → Site URL** → set to the production
   origin (keep `http://localhost:5173` in the redirect list for development).
2. Add `https://your-production-origin/**` to **Redirect URLs** so password
   recovery and email-confirmation links return to the deployed app.
3. Apply every file in `supabase/migrations/` (in filename order) and
   `supabase/seed.sql` in the project where production data should live.
4. Under **Database → Publications**, confirm `public.sessions` publishes to
   `supabase_realtime` (the timer migration does this automatically).

## Prerequisites

- Node.js 22+
- npm 10+
- A free Supabase project when starting Milestone 2

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in these values from the Supabase dashboard:

   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```

   Use the **publishable** key only. A service-role or secret key must never be added to this frontend or committed to source control.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Restart the Vite server after changing environment variables.

## Supabase project setup (Milestone 2)

1. Create a free project at <https://supabase.com/dashboard>.
2. In the project's **SQL Editor**, run each file in `supabase/migrations/`
   in filename order, then run the full contents of `supabase/seed.sql`.
   All of them are safe to re-run.
3. Copy the project URL and publishable key from **Project Settings → API**
   into `.env.local` and restart `npm run dev`.
4. In **Authentication → URL Configuration**:
   - Set **Site URL** to `http://localhost:5173` (and your production origin later).
   - Add `http://localhost:5173/**` (and the production equivalent) to
     **Redirect URLs** so sign-up confirmations and password recovery links
     return to the app.
5. (Optional) Disable email confirmation under **Authentication → Sign In /
   Providers** to sign in immediately after account creation during development.

Verify the seed:

```sql
select section, count(*) from public.topics group by section;
-- theory: 11, systems: 12 (Paralelní systémy keeps official number 13)
```

After linking the Supabase CLI (`npx supabase link`), regenerate database
types with `npm run db:types`.

## Verification commands

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

The app uses browser history URLs. Vite supports direct nested URLs during development. For production, configure the chosen static host to direct all unmatched paths to `/index.html`; the exact provider configuration belongs to Milestone 7.

## Project structure

```text
src/
  app/                 # Routing, shell, page composition
  components/          # Shared app components
  components/ui/       # Editable shadcn/ui component source
  features/
    auth/              # Authentication routes and future auth logic
    overview/          # Dashboard
    sessions/          # Session history
    tasks/             # Mini-task logic (starts in Milestone 3)
    timer/             # Timer logic (starts in Milestone 4)
    topics/            # Topic list and detail
  lib/                 # Supabase client and shared utilities
  styles/              # Tailwind/shadcn variant support CSS
  types/               # Domain/generated types
supabase/              # Migrations and seed data (Milestone 2)
```

## Environment security

`.env`, `.env.local`, and other `*.local` files are ignored by Git. Keep actual credentials out of documentation, committed files, prompts, and frontend source control.
