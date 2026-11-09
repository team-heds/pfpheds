-- TEST ONLY. Execute against pfpheds-staging-db-1 / staging, never production.
-- Five fictional seats supplement the 59 copied proposals; 2027 = 2026-2027.
\set ON_ERROR_STOP on
BEGIN;
LOCK TABLE public.places IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
  IF current_database() <> 'staging' THEN
    RAISE EXCEPTION 'TEST database required';
  END IF;
  IF (SELECT coalesce(sum(nullif(pfp2_proposition->>'2027','')::int),0)
      FROM public.places WHERE "PlaceId" NOT LIKE 'TEST-BA25-PFP2-2027-%') <> 59 THEN
    RAISE EXCEPTION 'Expected exactly 59 existing proposals; recheck before adjusting';
  END IF;
END $$;

INSERT INTO public.institutions ("InstitutionId", "Name", "Description", "Language")
VALUES ('TEST-BA25-PFP2-2027-INSTITUTION', '[TEST] Institution fictive — PFP2 BA25',
        'Fixture de simulation uniquement. Aucune offre réelle, aucun destinataire.', 'FR')
ON CONFLICT ("InstitutionId") DO NOTHING;

INSERT INTO public.places
  ("PlaceId", "NomPlace", "InstitutionId", "PFP2", pfp2_proposition, "FR", "AMBU", "Note")
SELECT 'TEST-BA25-PFP2-2027-' || n,
       '[TEST] Place fictive ' || n || ' — PFP2 BA25 2026-2027',
       'TEST-BA25-PFP2-2027-INSTITUTION',
       '{"2027":"1"}'::jsonb, '{"2027":"1"}'::jsonb, true, true,
       'TEST UNIQUEMENT — capacité fictive pour simulation 64 étudiants / 64 places. Ne pas transférer en production.'
FROM generate_series(1,5) n
ON CONFLICT ("PlaceId") DO NOTHING;

DO $$
BEGIN
  IF (SELECT sum(nullif(pfp2_proposition->>'2027','')::int) FROM public.places) <> 64
     OR (SELECT count(*) FROM public.places WHERE "PlaceId" LIKE 'TEST-BA25-PFP2-2027-%') <> 5 THEN
    RAISE EXCEPTION 'Expected 64 total seats and 5 fictional places';
  END IF;
END $$;
COMMIT;
SELECT current_database() AS database,
       sum(nullif(pfp2_proposition->>'2027','')::int) AS proposed_seats,
       count(*) FILTER (WHERE "PlaceId" LIKE 'TEST-BA25-PFP2-2027-%') AS fictional_places
FROM public.places;
