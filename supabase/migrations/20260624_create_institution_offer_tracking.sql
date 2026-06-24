-- Suivi des offres de places envoyées par institution par année
CREATE TABLE IF NOT EXISTS public.institution_offer_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id TEXT NOT NULL,
  year TEXT NOT NULL,
  has_sent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  UNIQUE(institution_id, year)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_offer_tracking_institution ON public.institution_offer_tracking(institution_id);
CREATE INDEX IF NOT EXISTS idx_offer_tracking_year ON public.institution_offer_tracking(year);

-- Permissions
GRANT ALL ON public.institution_offer_tracking TO authenticated;
GRANT ALL ON public.institution_offer_tracking TO service_role;
