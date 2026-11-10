\set ON_ERROR_STOP on
-- Isolation des j'aime du fil : chacun ne crée et ne supprime que ses propres j'aime,
-- un seul j'aime par publication, aucun accès anonyme. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('71000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'liker.one@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('71000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'liker.two@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, display_name, is_active)
values
  ('71000000-0000-4000-8000-000000000001', 'liker.one@example.invalid', 'Liker One', true),
  ('71000000-0000-4000-8000-000000000002', 'liker.two@example.invalid', 'Liker Two', true)
on conflict (user_id) do update set display_name = excluded.display_name;

insert into public.posts (id, user_id, author_name, content)
values ('71000000-0000-4000-8000-0000000000a1', '71000000-0000-4000-8000-000000000002', 'Liker Two', 'Publication de test');

insert into public.post_likes (post_id, user_id)
values ('71000000-0000-4000-8000-0000000000a1', '71000000-0000-4000-8000-000000000002');

do $grants$
begin
  if has_table_privilege('anon', 'public.post_likes', 'select')
     or has_table_privilege('anon', 'public.post_likes', 'insert')
     or has_table_privilege('anon', 'public.post_likes', 'delete') then
    raise exception 'anon must not access post_likes';
  end if;
  if has_table_privilege('authenticated', 'public.post_likes', 'update') then
    raise exception 'authenticated must not update post_likes';
  end if;
  if has_function_privilege('anon', 'public.get_post_like_summaries(uuid[])', 'execute') then
    raise exception 'anon must not read like summaries';
  end if;
end
$grants$;

select set_config('request.jwt.claim.sub', '71000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $user_one$
declare
  v_rows integer;
  v_rejected boolean := false;
  v_count integer;
  v_mine boolean;
begin
  -- Aimer pour soi : accepté, user_id par défaut = auth.uid().
  insert into public.post_likes (post_id) values ('71000000-0000-4000-8000-0000000000a1');

  -- Deuxième j'aime : refusé par la contrainte unique.
  begin
    insert into public.post_likes (post_id) values ('71000000-0000-4000-8000-0000000000a1');
  exception when unique_violation then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'double like accepted'; end if;

  -- Rejouer un j'aime avec on conflict do nothing : idempotent.
  insert into public.post_likes (post_id) values ('71000000-0000-4000-8000-0000000000a1')
  on conflict do nothing;

  -- Aimer au nom d'un autre : refusé.
  v_rejected := false;
  begin
    insert into public.post_likes (post_id, user_id)
    values ('71000000-0000-4000-8000-0000000000a1', '71000000-0000-4000-8000-000000000002');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'liked on behalf of another user'; end if;

  select like_count, liked_by_me into v_count, v_mine
  from public.get_post_like_summaries(array['71000000-0000-4000-8000-0000000000a1'::uuid]);
  if v_count <> 2 or not v_mine then
    raise exception 'summary wrong: count %, mine %', v_count, v_mine;
  end if;

  select count(*) into v_count from public.get_post_likers('71000000-0000-4000-8000-0000000000a1');
  if v_count <> 2 then raise exception 'likers list wrong: %', v_count; end if;

  -- Supprimer le j'aime d'un autre : aucune ligne touchée.
  delete from public.post_likes
  where post_id = '71000000-0000-4000-8000-0000000000a1'
    and user_id = '71000000-0000-4000-8000-000000000002';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'deleted another user like'; end if;

  -- Retirer son propre j'aime.
  delete from public.post_likes where post_id = '71000000-0000-4000-8000-0000000000a1';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'own unlike removed % rows', v_rows; end if;

  select like_count, liked_by_me into v_count, v_mine
  from public.get_post_like_summaries(array['71000000-0000-4000-8000-0000000000a1'::uuid]);
  if v_count <> 1 or v_mine then
    raise exception 'summary after unlike wrong: count %, mine %', v_count, v_mine;
  end if;
end
$user_one$;

reset role;

-- Aucun XP pour un j'aime : la table n'a aucun déclencheur.
do $no_xp$
begin
  if exists (select 1 from pg_trigger where tgrelid = 'public.post_likes'::regclass and not tgisinternal) then
    raise exception 'post_likes must not carry triggers (likes give no XP)';
  end if;
end
$no_xp$;

rollback;

select 'post_likes isolation: passed' as result;
