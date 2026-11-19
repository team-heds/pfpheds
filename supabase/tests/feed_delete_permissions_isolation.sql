\set ON_ERROR_STOP on

-- Fil d'actualité : qui peut retirer une publication ou un commentaire.
--   * publication : son auteur seulement ;
--   * commentaire : son auteur ou l'auteur de la publication, personne d'autre.
-- Trois comptes existants : A et B publient, A, B et C commentent.
-- Toutes les lignes de test disparaissent avec le ROLLBACK final.

BEGIN;

SELECT set_config('heds_test.uid_a', (SELECT id::text FROM auth.users ORDER BY created_at, id LIMIT 1 OFFSET 0), true);
SELECT set_config('heds_test.uid_b', (SELECT id::text FROM auth.users ORDER BY created_at, id LIMIT 1 OFFSET 1), true);
SELECT set_config('heds_test.uid_c', (SELECT id::text FROM auth.users ORDER BY created_at, id LIMIT 1 OFFSET 2), true);

DO $check$
BEGIN
  IF nullif(current_setting('heds_test.uid_c', true), '') IS NULL THEN
    RAISE EXCEPTION 'Feed delete permissions test requires three auth users';
  END IF;
END
$check$;

SELECT set_config('heds_test.post_a', gen_random_uuid()::text, true);
SELECT set_config('heds_test.post_b', gen_random_uuid()::text, true);
SELECT set_config('heds_test.b_on_a', gen_random_uuid()::text, true);
SELECT set_config('heds_test.c_on_a', gen_random_uuid()::text, true);
SELECT set_config('heds_test.c_stays_on_a', gen_random_uuid()::text, true);
SELECT set_config('heds_test.reply_b_to_c', gen_random_uuid()::text, true);
SELECT set_config('heds_test.a_on_b', gen_random_uuid()::text, true);
SELECT set_config('heds_test.c_on_b', gen_random_uuid()::text, true);

INSERT INTO public.posts (id, user_id, author_name, content) VALUES
  (current_setting('heds_test.post_a')::uuid, current_setting('heds_test.uid_a')::uuid, 'Test A', '<p>Publication de A</p>'),
  (current_setting('heds_test.post_b')::uuid, current_setting('heds_test.uid_b')::uuid, 'Test B', '<p>Publication de B</p>');

INSERT INTO public.post_comments (id, post_id, user_id, parent_id, content) VALUES
  (current_setting('heds_test.b_on_a')::uuid, current_setting('heds_test.post_a')::uuid, current_setting('heds_test.uid_b')::uuid, NULL, 'B sur A'),
  (current_setting('heds_test.c_on_a')::uuid, current_setting('heds_test.post_a')::uuid, current_setting('heds_test.uid_c')::uuid, NULL, 'C sur A'),
  (current_setting('heds_test.c_stays_on_a')::uuid, current_setting('heds_test.post_a')::uuid, current_setting('heds_test.uid_c')::uuid, NULL, 'C encore sur A'),
  (current_setting('heds_test.reply_b_to_c')::uuid, current_setting('heds_test.post_a')::uuid, current_setting('heds_test.uid_b')::uuid, current_setting('heds_test.c_on_a')::uuid, 'Réponse de B à C'),
  (current_setting('heds_test.a_on_b')::uuid, current_setting('heds_test.post_b')::uuid, current_setting('heds_test.uid_a')::uuid, NULL, 'A sur B'),
  (current_setting('heds_test.c_on_b')::uuid, current_setting('heds_test.post_b')::uuid, current_setting('heds_test.uid_c')::uuid, NULL, 'C sur B');

INSERT INTO public.post_likes (post_id, user_id) VALUES
  (current_setting('heds_test.post_a')::uuid, current_setting('heds_test.uid_b')::uuid);

INSERT INTO public.post_media (post_id, url, type) VALUES
  (current_setting('heds_test.post_a')::uuid, 'https://example.invalid/post-media/test.jpg', 'image/jpeg');

SET LOCAL ROLE authenticated;

-- C n'est l'auteur d'aucune publication : seulement ses propres commentaires.
SELECT set_config('request.jwt.claim.sub', current_setting('heds_test.uid_c'), true);

DO $as_c$
DECLARE
  removed integer;
BEGIN
  WITH d AS (DELETE FROM public.posts WHERE id = current_setting('heds_test.post_a')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 0 THEN RAISE EXCEPTION 'C a retiré la publication de A (% ligne)', removed; END IF;

  WITH d AS (DELETE FROM public.post_comments WHERE id = current_setting('heds_test.b_on_a')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 0 THEN RAISE EXCEPTION 'C a retiré le commentaire de B sur la publication de A'; END IF;

  WITH d AS (DELETE FROM public.post_comments WHERE id = current_setting('heds_test.a_on_b')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 0 THEN RAISE EXCEPTION 'C a retiré le commentaire de A sur la publication de B'; END IF;
END
$as_c$;

-- A : ni la publication de B, ni le commentaire de C sur la publication de B.
SELECT set_config('request.jwt.claim.sub', current_setting('heds_test.uid_a'), true);

DO $as_a_refused$
DECLARE
  removed integer;
BEGIN
  WITH d AS (DELETE FROM public.posts WHERE id = current_setting('heds_test.post_b')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 0 THEN RAISE EXCEPTION 'A a retiré la publication de B'; END IF;

  WITH d AS (DELETE FROM public.post_comments WHERE id = current_setting('heds_test.c_on_b')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 0 THEN RAISE EXCEPTION 'A a retiré le commentaire de C sur la publication de B'; END IF;
END
$as_a_refused$;

-- A, auteur de la publication A : retire le commentaire de C (sa réponse part avec lui)
-- et son propre commentaire sur la publication de B.
DO $as_a_allowed$
DECLARE
  removed integer;
  remaining integer;
BEGIN
  WITH d AS (DELETE FROM public.post_comments WHERE id = current_setting('heds_test.c_on_a')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 1 THEN RAISE EXCEPTION 'L''auteur de la publication doit retirer un commentaire reçu (% ligne)', removed; END IF;

  SELECT count(*) INTO remaining FROM public.post_comments WHERE id = current_setting('heds_test.reply_b_to_c')::uuid;
  IF remaining <> 0 THEN RAISE EXCEPTION 'La réponse au commentaire retiré doit disparaître avec lui'; END IF;

  WITH d AS (DELETE FROM public.post_comments WHERE id = current_setting('heds_test.a_on_b')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 1 THEN RAISE EXCEPTION 'A doit retirer son propre commentaire (% ligne)', removed; END IF;
END
$as_a_allowed$;

-- B : retire le commentaire de C reçu sur sa publication et son propre commentaire sur A.
SELECT set_config('request.jwt.claim.sub', current_setting('heds_test.uid_b'), true);

DO $as_b$
DECLARE
  removed integer;
BEGIN
  WITH d AS (DELETE FROM public.posts WHERE id = current_setting('heds_test.post_a')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 0 THEN RAISE EXCEPTION 'B a retiré la publication de A'; END IF;

  WITH d AS (DELETE FROM public.post_comments WHERE id = current_setting('heds_test.c_on_b')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 1 THEN RAISE EXCEPTION 'B doit retirer un commentaire reçu sur sa publication (% ligne)', removed; END IF;

  WITH d AS (DELETE FROM public.post_comments WHERE id = current_setting('heds_test.b_on_a')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 1 THEN RAISE EXCEPTION 'B doit retirer son propre commentaire (% ligne)', removed; END IF;
END
$as_b$;

-- A retire sa publication : j'aime, médias et commentaires partent avec elle.
SELECT set_config('request.jwt.claim.sub', current_setting('heds_test.uid_a'), true);

DO $as_a_post$
DECLARE
  removed integer;
  leftovers integer;
BEGIN
  WITH d AS (DELETE FROM public.posts WHERE id = current_setting('heds_test.post_a')::uuid RETURNING 1)
  SELECT count(*) INTO removed FROM d;
  IF removed <> 1 THEN RAISE EXCEPTION 'A doit retirer sa publication (% ligne)', removed; END IF;

  SELECT
    (SELECT count(*) FROM public.post_comments WHERE post_id = current_setting('heds_test.post_a')::uuid)
    + (SELECT count(*) FROM public.post_likes WHERE post_id = current_setting('heds_test.post_a')::uuid)
    + (SELECT count(*) FROM public.post_media WHERE post_id = current_setting('heds_test.post_a')::uuid)
  INTO leftovers;
  IF leftovers <> 0 THEN RAISE EXCEPTION 'Lignes restantes après le retrait de la publication : %', leftovers; END IF;
END
$as_a_post$;

RESET ROLE;
ROLLBACK;

SELECT 'feed_delete_permissions_isolation_ok' AS result;
