-- Migration: Add priority_reasons column to votation_sessions
-- Date: 2026-02-25
-- Description: Adds priority_reasons (jsonb) to persist reason tags per student.
--              Draft priority lists use status='closed' + opened_at=NULL to avoid
--              modifying the existing CHECK constraint on status.

-- Add priority_reasons column (JSONB object: { user_id: [reason1, reason2], ... })
ALTER TABLE votation_sessions
ADD COLUMN IF NOT EXISTS priority_reasons jsonb DEFAULT NULL;

COMMENT ON COLUMN votation_sessions.priority_reasons IS 'JSON object mapping user_id to array of reason strings for priority selection';
