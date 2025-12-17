-- ============================================
-- TABLE: RepondantPhysioHES
-- Description: Table des répondants HES pour la physiothérapie
-- ============================================

-- Création de la table
CREATE TABLE IF NOT EXISTS public."RepondantPhysioHES" (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT repondant_physio_hes_pkey PRIMARY KEY (id),
  CONSTRAINT repondant_physio_hes_email_key UNIQUE (email),
  CONSTRAINT repondant_physio_hes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_repondant_physio_hes_user_id 
  ON public."RepondantPhysioHES" USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_repondant_physio_hes_email 
  ON public."RepondantPhysioHES" USING btree (email) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_repondant_physio_hes_last_name 
  ON public."RepondantPhysioHES" USING btree (last_name) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_repondant_physio_hes_is_active 
  ON public."RepondantPhysioHES" USING btree (is_active) TABLESPACE pg_default;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_repondant_physio_hes_updated_at 
  BEFORE UPDATE ON public."RepondantPhysioHES" 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INSERTION DES 8 RÉPONDANTS
-- ============================================

INSERT INTO public."RepondantPhysioHES" (user_id, first_name, last_name, email) VALUES
  ('cc0164fd-9fd6-4576-a97a-18077dcb1837', 'Rebecca', 'Blum', 'rebecca.blum@hevs.ch'),
  ('753fbb60-8b69-488f-9eb2-3ee88575dfd3', 'Marie-Christine', 'Demilt-Blanjean', 'marie-christine.demilt-blanjean@hevs.ch'),
  ('dc663584-db49-477e-89cc-d5735cfcc484', 'Fabien', 'Gerber', 'fabien.gerber@hevs.ch'),
  ('aaf2059f-f489-4605-9557-d1c121802631', 'Benoît', 'Bontempelli', 'benoit.bontempe@hes-so.ch'),
  ('15fa1ff4-0f0b-4c35-a557-fddc4415579a', 'Patrick', 'Crettenand', 'patrick.crettenand@hevs.ch'),
  ('a1cec42f-d1bf-4983-be9c-02499c7af637', 'Jonathan', 'Tam', 'jonathan.tam@hevs.ch'),
  ('594191b9-38ef-4ae2-b69c-d34f02b245ea', 'Seraina', 'Obrist', 'seraina.obrist@hevs.ch'),
  ('a9db2fd0-e640-406d-a2db-0bd2b9437608', 'Christophe', 'Baur', 'christophe.baur@hevs.ch')
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = now();

-- ============================================
-- RLS (Row Level Security) - Optionnel
-- ============================================

-- Activer RLS
ALTER TABLE public."RepondantPhysioHES" ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture (tous les utilisateurs authentifiés)
CREATE POLICY "Allow read for authenticated users" 
  ON public."RepondantPhysioHES" 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Politique pour modification (admin seulement - à adapter selon vos besoins)
CREATE POLICY "Allow all for service role" 
  ON public."RepondantPhysioHES" 
  FOR ALL 
  TO service_role 
  USING (true);
