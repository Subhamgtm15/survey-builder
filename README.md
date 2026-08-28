# Surveyor — a dynamic survey builder

Surveyor is a small full-stack app I built as a take-home project. Admins design surveys from a handful of question types, share a public link, collect responses, and see the results summarised per question.

The thing I cared about most was making the survey *structure* dynamic: an admin can invent any combination of questions and the public form just renders it, with no code changes and no new database tables. Everything about a survey lives in one flexible schema.

Frontend is React + TypeScript (Vite + Tailwind); the backend is Node + Express on top of PostgreSQL.

## Live Demo

- **App (admin panel):** https://survey-builder-omega.vercel.app/admin
- **Public form example:** https://survey-builder-omega.vercel.app/s/1
- **API:** https://survey-builder-uyso.onrender.com
- **Demo video:** _add link here (optional)_

Default admin (for the live demo): `admin@survey.app` / `SurveyAdmin2026!`

## Features

### Admin panel (survey builder)
- Create, edit, publish, and delete surveys
- Add questions of five types: short text, paragraph, single choice, multiple choice, and rating
- Add/remove options, set max rating, mark questions required, reorder questions
- Publish toggle controls whether the public form is accessible

### Public survey form
- Public access at `/s/:id` (no login required)
- Questions render dynamically from the survey schema
- Client-side validation (required fields, valid selections) with server-side validation as the source of truth

### Analytics dashboard
- Total responses per survey
- Per-question insights:
  - Choice questions → option counts (bar chart)
  - Rating questions → average + distribution (bar chart)
  - Text questions → list of submitted answers

### Security / quality
- JWT (Bearer) authentication protecting all admin endpoints
- Passwords hashed with bcrypt
- Rate limiting on login and public response submission (spam protection)
- Parameterized SQL queries throughout

## Architecture

```
survey-app/
├── backend/          Express + PostgreSQL API (TypeScript)
│   ├── migrations/   SQL schema
│   └── src/
│       ├── routes/   auth, surveys (admin), public (form + submit)
│       ├── middlewares/  JWT auth, rate limiting
│       └── utils/    question + answer validation
└── frontend/         React + Vite + Tailwind (TypeScript)
    └── src/
        ├── pages/admin/   Login, SurveyList, SurveyBuilder, Analytics
        ├── pages/public/  SurveyForm
        ├── api/           Axios client with auth interceptor
        └── store/         Zustand auth store
```

### Data model
- `surveys.questions` is stored as **JSONB**, so the schema is fully dynamic.
- `responses.answers` is stored as **JSONB**, keyed by question id, in a separate table.

## Getting Started (local)

Prerequisites: Node.js 20+, PostgreSQL running locally.

### 1. Backend

```bash
cd backend
cp .env.example .env        # then edit DB creds + JWT_SECRET
npm install
npm run migrate             # applies schema + seeds the admin
npm run dev                 # starts API on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # starts app on http://localhost:5173
```

Open `http://localhost:5173/admin`, log in with the seed admin, create and publish a survey, then open its public link (`/s/:id`) to submit responses and view analytics.

## API Overview

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/auth/login` | – | Admin login → JWT |
| POST | `/surveys` | admin | Create survey |
| GET | `/surveys` | admin | List surveys + response counts |
| GET | `/surveys/:id` | admin | Get one survey |
| PUT | `/surveys/:id` | admin | Update survey |
| DELETE | `/surveys/:id` | admin | Delete survey |
| GET | `/surveys/:id/analytics` | admin | Aggregated insights |
| GET | `/public/surveys/:id` | – | Fetch published survey |
| POST | `/public/surveys/:id/responses` | – (rate limited) | Submit a response |

## Deployment

- **Database:** Neon (managed PostgreSQL). Set `DATABASE_URL` on the backend.
- **Backend:** Render web service (`npm run migrate` once, then `npm start`).
- **Frontend:** Vercel. Set `VITE_API_URL` to the Render URL.

## What I learned building this

A few things I hadn't really done before this project:

- **Rendering forms from a schema instead of hardcoding them.** This was the big one. The survey is just a JSON array of questions, and the public form loops over it and picks the right input for each type (text, choice, rating, and so on). Adding a new question type is mostly one more branch in the render, not a new table or migration.
- **Storing flexible data in Postgres with JSONB.** I used to reach for extra tables any time data had a "variable shape". Here I learned JSONB lets me keep the whole survey (and each response) as a single document keyed by question id, and still query it. It genuinely changed how I decide when a relational table is worth it.
- **Validating the same data twice, for different reasons.** The client validates for fast feedback, but the client can always be bypassed, so the server re-checks every answer against the survey schema and is the real source of truth. It also drops any answer keys it doesn't recognise before saving.
- **JWT auth across two different origins.** Getting a Vercel frontend and a Render backend to talk to each other made me actually understand CORS, preflight requests, and why I went with a Bearer token in a header rather than cookies.
- **Actually shipping it, not just running it locally.** Wiring up Neon → Render → Vercel, handling SSL on the managed database, setting `trust proxy` so rate limiting works behind Render's proxy, and juggling environment variables per platform.

## What I'd add with more time

- **Survey versioning** — right now, editing a published survey changes the schema underneath responses that already came in. I'd snapshot the schema per response so old answers always render against the version they were answered with.
- **Partial / resumable responses** — let a user save a draft as they fill the form.
- **Pagination** on the survey list and analytics once there's real volume.

## Tech Stack

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Recharts, Axios · Node.js, Express, PostgreSQL (pg), JWT, bcrypt, express-rate-limit.
