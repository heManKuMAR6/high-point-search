import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Returns the migration SQL for the superadmin to copy-run in the Supabase SQL Editor.
// Supabase's JS client has no way to execute DDL directly without a custom stored procedure.
export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    instructions: 'Copy the sql field below and run it in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql',
    sql: `
ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS first_name          TEXT,
  ADD COLUMN IF NOT EXISTS last_name           TEXT,
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url        TEXT,
  ADD COLUMN IF NOT EXISTS resume_url          TEXT,
  ADD COLUMN IF NOT EXISTS skills              TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS veteran_status      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS age_50_plus         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS placement_status    TEXT    DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS utm_source          TEXT,
  ADD COLUMN IF NOT EXISTS utm_job             TEXT,
  ADD COLUMN IF NOT EXISTS needs_sponsorship   BOOLEAN,
  ADD COLUMN IF NOT EXISTS desired_salary_min  INTEGER,
  ADD COLUMN IF NOT EXISTS desired_salary_max  INTEGER,
  ADD COLUMN IF NOT EXISTS location            TEXT,
  ADD COLUMN IF NOT EXISTS city                TEXT,
  ADD COLUMN IF NOT EXISTS state               TEXT;

ALTER TABLE employers
  ADD COLUMN IF NOT EXISTS verified_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ein             TEXT,
  ADD COLUMN IF NOT EXISTS can_sponsor     BOOLEAN DEFAULT false;

UPDATE employers
  SET verified_status = verification_status
  WHERE verified_status IS NULL AND verification_status IS NOT NULL;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS salary_min       INTEGER,
  ADD COLUMN IF NOT EXISTS salary_max       INTEGER,
  ADD COLUMN IF NOT EXISTS veteran_friendly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS required_skills  TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description      TEXT    DEFAULT '',
  ADD COLUMN IF NOT EXISTS can_sponsor      BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS candidate_matches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id       UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL DEFAULT 0,
  breakdown    JSONB,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (candidate_id, job_id)
);

CREATE TABLE IF NOT EXISTS pipeline_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  stage        TEXT NOT NULL,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS candidate_notes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  author_id    UUID REFERENCES users(id),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_snapshot (
  snapshot_date             DATE PRIMARY KEY,
  stale_pipeline_count      INTEGER DEFAULT 0,
  new_candidates_count      INTEGER DEFAULT 0,
  matching_matched          INTEGER DEFAULT 0,
  expiring_guarantees_count INTEGER DEFAULT 0,
  overdue_invoices_count    INTEGER DEFAULT 0,
  created_at                TIMESTAMPTZ DEFAULT now()
);
    `.trim(),
  })
}
