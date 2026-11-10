\set ON_ERROR_STOP on
-- Isolation des commentaires du fil : chacun ne crée et ne supprime que ses propres
-- commentaires, aucune modification, aucun accès anonyme, date posée par le serveur,
-- réponses sur un seul niveau et dans la même publication. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('72000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'commenter.one@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('72000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'commenter.two@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, display_name, is_active)
values
  ('72000000-0000-4000-8000-000000000001', 'commenter.one@example.invalid', 'Commenter One', true),
  ('72000000-0000-4000-8000-000000000002', 'commenter.two@example.invalid', 'Commenter Two', true)
on conflict (user_id) do update set display_name = excluded.display_name;

insert into public.posts (id, user_id, author_name, content)
values
  ('72000000-0000-4000-8000-0000000000a1', '72000000-0000-4000-8000-000000000002', 'Commenter Two', 'Publication A'),
  ('72000000-0000-4000-8000-0000000000a2', '72000000-0000-4000-8000-000000000002', 'Commenter Two', 'Publication B');

-- Commentaire de l'utilisateur 2 (créé en tant que propriétaire de la base).
insert into public.post_comments (id, post_id, user_id, content)
values ('72000000-0000-4000-8000-0000000000c1', '72000000-0000-4000-8000-0000000000a1', '72000000-0000-4000-8000-000000000002', 'Premier commentaire');

do $grants$
begin
  if has_table_privilege('anon', 'public.post_comments', 'select')
     or has_table_privilege('anon', 'public.post_comments', 'insert')
     or has_table_privilege('anon', 'public.post_comments', 'delete') then
    raise exception 'anon must not access post_comments';
  end if;
  if has_table_privilege('authenticated', 'public.post_comments', 'update') then
    raise exception 'authenticated must not update post_comments';
  end if;
  if has_column_privilege('authenticated', 'public.post_comments', 'created_at', 'insert') then
    raise exception 'authenticated must not choose created_at';
  end if;
  if has_function_privilege('anon', 'public.get_post_comment_counts(uuid[])', 'execute')
     or has_function_privilege('anon', 'public.get_post_comments(uuid, integer)', 'execute') then
    raise exception 'anon must not read comments';
  end if;
end
$grants$;

select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $user_one$
declare
  v_rows integer;
  v_rejected boolean;
  v_count integer;
  v_author text;
  v_reply uuid := '72000000-0000-4000-8000-0000000000c3';
begin
  -- Commenter pour soi : accepté, user_id par défaut = auth.uid(), id fourni par le client.
  insert into public.post_comments (id, post_id, content)
  values ('72000000-0000-4000-8000-0000000000c2', '72000000-0000-4000-8000-0000000000a1', 'Bravo !');

  -- Commenter au nom d'un autre : refusé.
  v_rejected := false;
  begin
    insert into public.post_comments (post_id, user_id, content)
    values ('72000000-0000-4000-8000-0000000000a1', '72000000-0000-4000-8000-000000000002', 'Usurpation');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'commented on behalf of another user'; end if;

  -- Antidater : refusé (pas de droit sur created_at).
  v_rejected := false;
  begin
    insert into public.post_comments (post_id, content, created_at)
    values ('72000000-0000-4000-8000-0000000000a1', 'Antidaté', now() - interval '1 year');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'created_at accepted from client'; end if;

  -- Texte vide : refusé.
  v_rejected := false;
  begin
    insert into public.post_comments (post_id, content) values ('72000000-0000-4000-8000-0000000000a1', '   ');
  exception when check_violation then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'blank comment accepted'; end if;

  -- Répondre à un commentaire de premier niveau : accepté.
  insert into public.post_comments (id, post_id, parent_id, content)
  values (v_reply, '72000000-0000-4000-8000-0000000000a1', '72000000-0000-4000-8000-0000000000c1', 'Merci');

  -- Répondre à une réponse : refusé (un seul niveau).
  v_rejected := false;
  begin
    insert into public.post_comments (post_id, parent_id, content)
    values ('72000000-0000-4000-8000-0000000000a1', v_reply, 'Trop profond');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'nested reply accepted'; end if;

  -- Réponse rattachée à une autre publication : refusée.
  v_rejected := false;
  begin
    insert into public.post_comments (post_id, parent_id, content)
    values ('72000000-0000-4000-8000-0000000000a2', '72000000-0000-4000-8000-0000000000c1', 'Mauvaise publication');
  exception when insufficient_privilege or foreign_key_violation then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'reply across posts accepted'; end if;

  -- Modifier : refusé.
  v_rejected := false;
  begin
    update public.post_comments set content = 'Modifié' where id = '72000000-0000-4000-8000-0000000000c2';
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'update accepted'; end if;

  select comment_count into v_count
  from public.get_post_comment_counts(array['72000000-0000-4000-8000-0000000000a1'::uuid]);
  if v_count <> 3 then raise exception 'count wrong: %', v_count; end if;

  select display_name into v_author
  from public.get_post_comments('72000000-0000-4000-8000-0000000000a1')
  where id = '72000000-0000-4000-8000-0000000000c1';
  if v_author <> 'Commenter Two' then raise exception 'author wrong: %', v_author; end if;

  -- Supprimer le commentaire d'un autre : aucune ligne touchée.
  delete from public.post_comments where id = '72000000-0000-4000-8000-0000000000c1';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'deleted another user comment'; end if;

  -- Supprimer son propre commentaire.
  delete from public.post_comments where id = '72000000-0000-4000-8000-0000000000c2';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'own delete removed % rows', v_rows; end if;
end
$user_one$;

reset role;

-- Supprimer un commentaire supprime ses réponses.
delete from public.post_comments where id = '72000000-0000-4000-8000-0000000000c1';
do $cascade$
begin
  if exists (select 1 from public.post_comments where post_id = '72000000-0000-4000-8000-0000000000a1') then
    raise exception 'replies not removed with their parent';
  end if;
end
$cascade$;

-- Aucun XP pour un commentaire : la table n'a aucun déclencheur.
do $no_xp$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.post_comments'::regclass and not tgisinternal) then
    raise exception 'post_comments must not carry triggers (comments give no XP)';
  end if;
end
$no_xp$;

rollback;

select 'post_comments isolation: passed' as result;
