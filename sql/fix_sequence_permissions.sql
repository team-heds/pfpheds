-- Fix permissions for the sequence used by BIGSERIAL
GRANT USAGE ON SEQUENCE public.recap_cpt_evaluation_id_seq TO authenticated;
GRANT SELECT ON SEQUENCE public.recap_cpt_evaluation_id_seq TO authenticated;

-- Alternative: Change the table to use UUID instead of BIGSERIAL
-- (Uncomment and run if the above doesn't work)

-- ALTER TABLE recap_cpt_evaluation 
-- DROP COLUMN id,
-- ADD COLUMN id UUID DEFAULT gen_random_uuid() PRIMARY KEY;

-- Then update the Vue component to remove the id from the payload
