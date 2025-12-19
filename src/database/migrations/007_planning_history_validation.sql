-- Migration: Historique des modifications et validation du planning
-- Date: 2025-12-19
-- Description: Tables pour l'audit des modifications et la validation du planning par les RM

-- =====================================================
-- 1. TABLE: planning_history (Historique des modifications)
-- =====================================================
DROP TABLE IF EXISTS public.planning_history CASCADE;

CREATE TABLE public.planning_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id integer NOT NULL,
  module_code text,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changed_by uuid REFERENCES auth.users(id),
  changed_by_name text,
  changed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  old_data jsonb,
  new_data jsonb,
  changes_summary text
);

CREATE INDEX idx_planning_history_slot ON public.planning_history(slot_id);
CREATE INDEX idx_planning_history_module ON public.planning_history(module_code);
CREATE INDEX idx_planning_history_date ON public.planning_history(changed_at DESC);
CREATE INDEX idx_planning_history_user ON public.planning_history(changed_by);

-- RLS
ALTER TABLE public.planning_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planning_history_select_all" ON public.planning_history;
CREATE POLICY "planning_history_select_all"
  ON public.planning_history
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "planning_history_insert_authenticated" ON public.planning_history;
CREATE POLICY "planning_history_insert_authenticated"
  ON public.planning_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- 2. TABLE: planning_validations (Validation du planning)
-- =====================================================
DROP TABLE IF EXISTS public.planning_validations CASCADE;

CREATE TABLE public.planning_validations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_code text NOT NULL,
  class_code text NOT NULL,
  year text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'validated', 'rejected')),
  validated_by uuid REFERENCES auth.users(id),
  validated_by_name text,
  validated_at timestamp with time zone,
  rejection_reason text,
  comments text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT planning_validations_unique UNIQUE (module_code, class_code, year)
);

CREATE INDEX idx_planning_validations_module ON public.planning_validations(module_code);
CREATE INDEX idx_planning_validations_status ON public.planning_validations(status);

-- RLS
ALTER TABLE public.planning_validations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planning_validations_select_all" ON public.planning_validations;
CREATE POLICY "planning_validations_select_all"
  ON public.planning_validations
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "planning_validations_insert_authenticated" ON public.planning_validations;
CREATE POLICY "planning_validations_insert_authenticated"
  ON public.planning_validations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "planning_validations_update_authenticated" ON public.planning_validations;
CREATE POLICY "planning_validations_update_authenticated"
  ON public.planning_validations
  FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- 3. TABLE: module_hours_budget (Budget heures par module)
-- =====================================================
DROP TABLE IF EXISTS public.module_hours_budget CASCADE;

CREATE TABLE public.module_hours_budget (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_code text NOT NULL,
  year text NOT NULL,
  planned_hours numeric(6,2) DEFAULT 0,
  lecture_hours numeric(6,2) DEFAULT 0,
  tp_hours numeric(6,2) DEFAULT 0,
  td_hours numeric(6,2) DEFAULT 0,
  exam_hours numeric(6,2) DEFAULT 0,
  other_hours numeric(6,2) DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT module_hours_budget_unique UNIQUE (module_code, year)
);

CREATE INDEX idx_module_hours_budget_module ON public.module_hours_budget(module_code);

-- RLS
ALTER TABLE public.module_hours_budget ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_hours_budget_select_all" ON public.module_hours_budget;
CREATE POLICY "module_hours_budget_select_all"
  ON public.module_hours_budget
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "module_hours_budget_all_authenticated" ON public.module_hours_budget;
CREATE POLICY "module_hours_budget_all_authenticated"
  ON public.module_hours_budget
  FOR ALL
  TO authenticated
  USING (true);

-- =====================================================
-- 4. TRIGGER: Auto-log des modifications sur planning_time_slots
-- =====================================================
CREATE OR REPLACE FUNCTION log_planning_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action text;
  v_changes text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_changes := 'Création du créneau';
    INSERT INTO public.planning_history (slot_id, module_code, action, old_data, new_data, changes_summary)
    VALUES (NEW.id, NEW.module_code, v_action, NULL, to_jsonb(NEW), v_changes);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_changes := '';
    IF OLD.day != NEW.day THEN v_changes := v_changes || 'Jour: ' || OLD.day || ' → ' || NEW.day || '; '; END IF;
    IF OLD.start_time != NEW.start_time THEN v_changes := v_changes || 'Début: ' || OLD.start_time || ' → ' || NEW.start_time || '; '; END IF;
    IF OLD.end_time != NEW.end_time THEN v_changes := v_changes || 'Fin: ' || OLD.end_time || ' → ' || NEW.end_time || '; '; END IF;
    IF OLD.room IS DISTINCT FROM NEW.room THEN v_changes := v_changes || 'Salle: ' || COALESCE(OLD.room, '-') || ' → ' || COALESCE(NEW.room, '-') || '; '; END IF;
    IF OLD.teachers::text IS DISTINCT FROM NEW.teachers::text THEN v_changes := v_changes || 'Enseignants modifiés; '; END IF;
    IF v_changes = '' THEN v_changes := 'Modification mineure'; END IF;
    INSERT INTO public.planning_history (slot_id, module_code, action, old_data, new_data, changes_summary)
    VALUES (NEW.id, NEW.module_code, v_action, to_jsonb(OLD), to_jsonb(NEW), v_changes);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_changes := 'Suppression du créneau S' || OLD.week_number || ' ' || OLD.day;
    INSERT INTO public.planning_history (slot_id, module_code, action, old_data, new_data, changes_summary)
    VALUES (OLD.id, OLD.module_code, v_action, to_jsonb(OLD), NULL, v_changes);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS planning_time_slots_history_trigger ON public.planning_time_slots;
CREATE TRIGGER planning_time_slots_history_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.planning_time_slots
  FOR EACH ROW EXECUTE FUNCTION log_planning_changes();

-- =====================================================
-- 5. Commentaires
-- =====================================================
COMMENT ON TABLE public.planning_history IS 'Historique des modifications du planning';
COMMENT ON TABLE public.planning_validations IS 'Validation du planning par les RM';
COMMENT ON TABLE public.module_hours_budget IS 'Budget heures prévu par module et année';
