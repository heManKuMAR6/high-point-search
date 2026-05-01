-- Run this in the Supabase SQL Editor (dashboard.supabase.com → your project → SQL Editor)
-- Safe to run multiple times — all statements use IF NOT EXISTS

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS first_name         TEXT,
  ADD COLUMN IF NOT EXISTS last_name          TEXT,
  ADD COLUMN IF NOT EXISTS phone              TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url       TEXT,
  ADD COLUMN IF NOT EXISTS resume_url         TEXT,
  ADD COLUMN IF NOT EXISTS skills             TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS veteran_status     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_50_plus        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS placement_status   TEXT    DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS utm_source         TEXT,
  ADD COLUMN IF NOT EXISTS utm_job            TEXT,
  ADD COLUMN IF NOT EXISTS needs_sponsorship  BOOLEAN,
  ADD COLUMN IF NOT EXISTS desired_salary_min INTEGER,
  ADD COLUMN IF NOT EXISTS desired_salary_max INTEGER,
  ADD COLUMN IF NOT EXISTS location           TEXT,
  ADD COLUMN IF NOT EXISTS city               TEXT,
  ADD COLUMN IF NOT EXISTS state              TEXT;

-- Employers: normalise verification column name (signup uses verification_status, admin uses verified_status)
ALTER TABLE employers
  ADD COLUMN IF NOT EXISTS verified_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ein             TEXT,
  ADD COLUMN IF NOT EXISTS can_sponsor     BOOLEAN DEFAULT false;

-- Copy any existing verification_status values over
UPDATE employers SET verified_status = verification_status WHERE verified_status IS NULL AND verification_status IS NOT NULL;

-- Jobs: extra columns used by matching engine and public board
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS salary_min       INTEGER,
  ADD COLUMN IF NOT EXISTS salary_max       INTEGER,
  ADD COLUMN IF NOT EXISTS veteran_friendly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS required_skills  TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description      TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS can_sponsor      BOOLEAN DEFAULT false;

-- Candidate matches written by the scoring engine
CREATE TABLE IF NOT EXISTS candidate_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL DEFAULT 0,
  breakdown    JSONB,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (candidate_id, job_id)
);

-- Pipeline events (admin kanban stage history)
CREATE TABLE IF NOT EXISTS pipeline_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  stage        TEXT NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Candidate notes (admin slide-over)
CREATE TABLE IF NOT EXISTS candidate_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES users(id),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Daily digest snapshot
CREATE TABLE IF NOT EXISTS daily_snapshot (
  snapshot_date             DATE PRIMARY KEY,
  stale_pipeline_count      INTEGER DEFAULT 0,
  new_candidates_count      INTEGER DEFAULT 0,
  matching_matched          INTEGER DEFAULT 0,
  expiring_guarantees_count INTEGER DEFAULT 0,
  overdue_invoices_count    INTEGER DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT now()
);

-- Fee ledger
CREATE TABLE IF NOT EXISTS fee_ledger (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID REFERENCES placements(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  amount       NUMERIC(12,2),
  invoice_ref  TEXT,
  notes        TEXT,
  invoiced_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
