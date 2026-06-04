-- Migration 004: candidate_matches blocked columns + daily_snapshot fixes + password reset
-- Safe to re-run (IF NOT EXISTS guards throughout).

-- ── candidate_matches: add blocked/block_reason from matching engine ───────────
ALTER TABLE candidate_matches ADD COLUMN IF NOT EXISTS blocked       BOOLEAN DEFAULT false;
ALTER TABLE candidate_matches ADD COLUMN IF NOT EXISTS block_reason  TEXT;
ALTER TABLE candidate_matches ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT now();

-- Re-add unique constraint with correct name if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'candidate_matches_candidate_job_unique'
  ) THEN
    ALTER TABLE candidate_matches
      ADD CONSTRAINT candidate_matches_candidate_job_unique UNIQUE (candidate_id, job_id);
  END IF;
END $$;

-- ── daily_snapshot: add missing columns ────────────────────────────────────────
ALTER TABLE daily_snapshot ADD COLUMN IF NOT EXISTS stale_pipeline_candidate_ids  UUID[]  DEFAULT '{}';
ALTER TABLE daily_snapshot ADD COLUMN IF NOT EXISTS new_candidate_ids              UUID[]  DEFAULT '{}';
ALTER TABLE daily_snapshot ADD COLUMN IF NOT EXISTS matching_processed             INTEGER DEFAULT 0;
ALTER TABLE daily_snapshot ADD COLUMN IF NOT EXISTS matching_errors               TEXT[]  DEFAULT '{}';
ALTER TABLE daily_snapshot ADD COLUMN IF NOT EXISTS expiring_guarantee_ids        UUID[]  DEFAULT '{}';
ALTER TABLE daily_snapshot ADD COLUMN IF NOT EXISTS overdue_invoice_ids           UUID[]  DEFAULT '{}';
ALTER TABLE daily_snapshot ADD COLUMN IF NOT EXISTS updated_at                    TIMESTAMPTZ DEFAULT now();

-- ── employers: add verification_status column (used in badge logic) ───────────
ALTER TABLE employers ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';

-- ── placements: add placed_at + fee_status columns ────────────────────────────
ALTER TABLE placements ADD COLUMN IF NOT EXISTS placed_at   DATE;
ALTER TABLE placements ADD COLUMN IF NOT EXISTS fee_status  TEXT DEFAULT 'pending';
ALTER TABLE placements ADD COLUMN IF NOT EXISTS notes       TEXT;

-- ── password_reset_tokens ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_prt_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user  ON password_reset_tokens(user_id);
