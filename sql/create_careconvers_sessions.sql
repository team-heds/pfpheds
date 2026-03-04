-- ============================================
-- Table: careconvers_sessions
-- Stockage persistant de l'état CareConvers par utilisateur
-- ============================================

CREATE TABLE IF NOT EXISTS careconvers_sessions (
  user_id TEXT PRIMARY KEY,
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step >= 1),
  opqrst_count INTEGER NOT NULL DEFAULT 0 CHECK (opqrst_count >= 0),
  isbar_parts TEXT[] NOT NULL DEFAULT '{}',
  quiz_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_careconvers_sessions_updated_at
  ON careconvers_sessions (updated_at DESC);

-- RLS activée : accès uniquement via service role (backend)
ALTER TABLE careconvers_sessions ENABLE ROW LEVEL SECURITY;
