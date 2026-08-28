-- Schema for the dynamic survey builder.

CREATE TABLE IF NOT EXISTS admins (
  id         SERIAL PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A survey stores its questions as a JSON array so the structure is fully dynamic.
-- Each question: { id, type, label, required, options?, maxRating? }
CREATE TABLE IF NOT EXISTS surveys (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  questions    JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Responses are stored separately from the survey schema.
-- answers: { [questionId]: string | string[] | number }
CREATE TABLE IF NOT EXISTS responses (
  id           SERIAL PRIMARY KEY,
  survey_id    INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  answers      JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responses_survey_id ON responses (survey_id);
