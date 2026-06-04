-- Run in the Supabase SQL Editor in one shot. Safe to re-run (IF NOT EXISTS / IF EXISTS guards throughout).

-- ── Jobs: new columns ─────────────────────────────────────────────────────────

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employment_type          TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level         TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_skills          TEXT[]  DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits                 TEXT[]  DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_remote                BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline     DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hiring_manager_name      TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hiring_manager_email     TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS number_of_openings       INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS veteran_friendly         BOOLEAN DEFAULT false;

-- ── Applications: fix FK + add new columns ────────────────────────────────────

-- Drop and re-add job_id so the FK is clean (nullable, no ON DELETE CASCADE)
ALTER TABLE applications DROP COLUMN IF EXISTS job_id;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_id      UUID REFERENCES jobs(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_note  TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS resume_url  TEXT;

-- Restore uniqueness constraint (candidate can only apply once per job)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'applications_candidate_job_unique'
  ) THEN
    ALTER TABLE applications
      ADD CONSTRAINT applications_candidate_job_unique UNIQUE (candidate_id, job_id);
  END IF;
END $$;
