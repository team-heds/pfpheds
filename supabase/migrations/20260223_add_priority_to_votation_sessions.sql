-- Migration: Add priority votation support to votation_sessions
-- Date: 2026-02-23
-- Description: Adds is_priority flag and priority_user_ids array to votation_sessions
--              to support private priority votation sessions for selected students.

-- Add is_priority column (defaults to false for existing sessions)
ALTER TABLE votation_sessions
ADD COLUMN IF NOT EXISTS is_priority boolean DEFAULT false;

-- Add priority_user_ids column (JSONB array of user UUIDs)
ALTER TABLE votation_sessions
ADD COLUMN IF NOT EXISTS priority_user_ids jsonb DEFAULT NULL;

-- Add index for faster lookups on priority sessions
CREATE INDEX IF NOT EXISTS idx_votation_sessions_is_priority
ON votation_sessions (is_priority)
WHERE is_priority = true;

-- Comment
COMMENT ON COLUMN votation_sessions.is_priority IS 'True if this is a priority votation session (only selected students can vote)';
COMMENT ON COLUMN votation_sessions.priority_user_ids IS 'JSON array of user_id UUIDs allowed to vote in this priority session';
