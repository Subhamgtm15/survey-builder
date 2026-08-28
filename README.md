# Survey Builder

A full-stack application for creating dynamic surveys, collecting public responses, and viewing per-question analytics.

Built with **React + TypeScript + Vite + Tailwind CSS** (frontend) and **Node.js + Express + PostgreSQL** (backend).

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

## Tech Stack

React 19, TypeScript, Vite, Tailwind CSS, TanStack Query, Zustand, Recharts, Axios · Node.js, Express, PostgreSQL (pg), JWT, bcrypt, express-rate-limit.
