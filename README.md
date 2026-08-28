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

A few concrete things I understand a lot better after this project:

- **Rendering a form from data instead of hardcoding it.** A survey is stored as an array of question objects (`{ id, type, label, required, options }`). The public form maps over that array and, based on each question's `type`, renders the matching input — a text box, radio buttons, checkboxes, or rating buttons. So the form builds itself from the data; adding a question type is one more case in the render, not a new form.
- **Using JSONB to store variable-shaped data.** Because every survey has a different set of questions, I store the questions (and each response's answers) as a JSONB column instead of spreading them across extra tables. Answers are keyed by question id, so reading an answer is just `answers[questionId]`. The trade-off I can explain: I give up some database-level integrity, so I enforce correctness in code instead.
- **Why the server has to validate too.** The form validates in the browser for quick feedback, but since anyone can call the API directly, the server re-validates every answer against the survey's real questions — required fields, valid options, a number in range for ratings — and only saves answers for question ids it recognises.
- **Turning raw answers into analytics.** For each question I look at all the responses and summarise by type: choice questions become option counts, ratings become an average plus a distribution, and text questions return the list of answers. That's what feeds the charts.
- **JWT auth between two separate origins.** Login returns a signed token; the frontend sends it as a `Bearer` header and the backend verifies it on every admin route. Because the frontend (Vercel) and backend (Render) are on different domains, I also had to set the allowed CORS origin so the browser would let the requests through.

## What I'd add with more time

- **Survey versioning** — right now, editing a published survey changes the schema underneath responses that already came in. I'd snapshot the schema per response so old answers always render against the version they were answered with.
- **Partial / resumable responses** — let a user save a draft as they fill the form.
- **Pagination** on the survey list and analytics once there's real volume.

## Tech Stack

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Recharts, Axios · Node.js, Express, PostgreSQL (pg), JWT, bcrypt, express-rate-limit.
