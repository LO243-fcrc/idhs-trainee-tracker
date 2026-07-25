# IDHS Trainee Tracker

Training progress and performance tracking for the Illinois Department of Human
Services, Division of Family and Community Services.

Developed and property of Hazem Albassam.

---

## Deploying (GitHub + Render + Supabase)

### 1. Supabase — create the database

1. Create a new project at supabase.com.
2. Open **Project Settings -> Database -> Connection string -> URI**.
3. Copy two values:
   - **Transaction pooler** URI (port `6543`) — this is `DATABASE_URL`
   - **Direct connection** URI (port `5432`) — this is `DIRECT_URL`
4. Replace `[YOUR-PASSWORD]` in both with your database password.

### 2. GitHub — upload the code

Create a new repository and upload the contents of this folder
(`backend/`, `frontend/`, `package.json`, `render.yaml`, `README.md`).

### 3. Render — deploy

1. **New -> Web Service**, connect the GitHub repository.
2. Confirm these settings (they come from `render.yaml`):
   - Build Command: `npm run build`
   - Start Command: `npm start`
3. Add exactly **two** environment variables:
   - `DATABASE_URL`
   - `DIRECT_URL`
4. Deploy. The build installs both halves, builds the frontend, and creates
   the database tables automatically.

### 4. Create the administrator account

Open the site. Because the database has no accounts yet, it shows
**"Create the administrator account"**. Fill it in — **this first account
becomes the administrator.**

After that, self-signup is closed. The administrator creates every other
account under **Settings -> Management Accounts**. This is deliberate: an
open signup page would let anyone who finds the URL read every trainee's
record.

---

## Accounts

| Who | How they get access | What they can do |
|---|---|---|
| Administrator | First account created in the app | Everything, plus create accounts, assign trainers/managers, issue trainee logins |
| Management (trainers, managers) | Created by the admin in Settings | All trainee data: add, edit, archive trainees, score metrics, log reviews |
| Trainees | Admin issues a username/password on the trainee's page | Only the daily report form at `/report` |

Trainee credentials are a separate credential space. A trainee login can
never reach the management app.

---

## Environment variables

Only two are required:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase pooled connection (port 6543) |
| `DIRECT_URL` | Yes | Supabase direct connection (port 5432) |
| `JWT_SECRET` | No | Auto-derived from `DATABASE_URL` if unset |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | No | Optional shortcut to pre-create an admin instead of using the setup screen |

---

## Running locally

```bash
npm run install:all
# create backend/.env with DATABASE_URL and DIRECT_URL
npm run build
npm start
```

Then open http://localhost:4000

---

## Features

- **Dashboard** — every active trainee, their month in the 12-month timeline,
  per-program status, and an On Track / Needs Improvement / At Risk indicator
- **Trainee detail** — employment and Highway Training dates, Medical/SNAP
  authorization pipeline, second-party reviews, ten performance metrics with
  full trend charts, quarterly evaluation snapshot, program progress
- **Reports** — certification rate, authorization counts, performance averages,
  program completion, filterable by trainee/trainer/manager/program/case
  type/date range, exportable to CSV
- **Settings** — add, edit, and archive trainees; admin-only account management
- **How to Use** — built-in guide for managers and for trainees
- **Daily self-report** — trainees log cases at `/report` on their own login
