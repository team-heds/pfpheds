-- ============================================
-- Table: careconvers_interactions
-- Journal persistant de toutes les interactions CareConvers
-- ============================================

CREATE TABLE IF NOT EXISTS careconvers_interactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  detected_intent TEXT,
  step_before INTEGER,
  step_after INTEGER,
  response_text TEXT,
  media_image_url TEXT,
  media_caption TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_careconvers_interactions_user_created
  ON careconvers_interactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_careconvers_interactions_created
  ON careconvers_interactions (created_at DESC);

-- RLS activée : accès prévu via service role backend
ALTER TABLE careconvers_interactions ENABLE ROW LEVEL SECURITY;
