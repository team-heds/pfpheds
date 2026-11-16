\set ON_ERROR_STOP on
-- Médias de stories : au plus 6 dépôts par 24 heures et 40 par 30 jours et par compte.
-- Les dépôts d'un autre compte ne comptent pas. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('7d000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'story.quota@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('7d000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'story.other@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

-- 20 anciens dépôts (il y a 10 jours) et 5 dépôts récents d'un autre compte.
insert into storage.objects (bucket_id, name, owner, created_at, metadata)
select 'stories', '7d000000-0000-4000-8000-000000000001/ancien-' || g || '.jpg',
       '7d000000-0000-4000-8000-000000000001', now() - interval '10 days', '{"size": 1000}'::jsonb
from generate_series(1, 20) g;
insert into storage.objects (bucket_id, name, owner, metadata)
select 'stories', '7d000000-0000-4000-8000-000000000002/autre-' || g || '.jpg',
       '7d000000-0000-4000-8000-000000000002', '{"size": 1000}'::jsonb
from generate_series(1, 5) g;

set local role authenticated;
select set_config('request.jwt.claim.sub', '7d000000-0000-4000-8000-000000000001', true);

do $quota$
declare
  v_refused boolean := false;
  i integer;
begin
  -- 6 dépôts sur 24 heures passent.
  for i in 1..6 loop
    insert into storage.objects (bucket_id, name, owner, metadata)
    values ('stories', '7d000000-0000-4000-8000-000000000001/jour-' || i || '.jpg',
            '7d000000-0000-4000-8000-000000000001', '{"size": 1000}'::jsonb);
  end loop;

  -- Le 7e est refusé.
  begin
    insert into storage.objects (bucket_id, name, owner, metadata)
    values ('stories', '7d000000-0000-4000-8000-000000000001/jour-7.jpg',
            '7d000000-0000-4000-8000-000000000001', '{"size": 1000}'::jsonb);
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'The 7th story upload within 24 hours must be refused'; end if;

  -- Toujours impossible de déposer dans le dossier d'un autre.
  v_refused := false;
  begin
    insert into storage.objects (bucket_id, name, owner, metadata)
    values ('stories', '7d000000-0000-4000-8000-000000000002/intrus.jpg',
            '7d000000-0000-4000-8000-000000000001', '{"size": 1000}'::jsonb);
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'Uploading into another user folder must be refused'; end if;
end
$quota$;

reset role;

-- Limite sur 30 jours : avec 40 dépôts récents (hors 24 h), plus rien ne passe.
update storage.objects set created_at = now() - interval '2 days'
where bucket_id = 'stories' and name like '7d000000-0000-4000-8000-000000000001/jour-%';
insert into storage.objects (bucket_id, name, owner, created_at, metadata)
select 'stories', '7d000000-0000-4000-8000-000000000001/mois-' || g || '.jpg',
       '7d000000-0000-4000-8000-000000000001', now() - interval '3 days', '{"size": 1000}'::jsonb
from generate_series(1, 14) g;

set local role authenticated;
select set_config('request.jwt.claim.sub', '7d000000-0000-4000-8000-000000000001', true);

do $month$
declare
  v_refused boolean := false;
begin
  begin
    insert into storage.objects (bucket_id, name, owner, metadata)
    values ('stories', '7d000000-0000-4000-8000-000000000001/mois-de-trop.jpg',
            '7d000000-0000-4000-8000-000000000001', '{"size": 1000}'::jsonb);
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then raise exception 'The 41st story upload within 30 days must be refused'; end if;
end
$month$;

-- L'autre compte (5 dépôts récents) peut encore déposer.
select set_config('request.jwt.claim.sub', '7d000000-0000-4000-8000-000000000002', true);
insert into storage.objects (bucket_id, name, owner, metadata)
values ('stories', '7d000000-0000-4000-8000-000000000002/autre-6.jpg',
        '7d000000-0000-4000-8000-000000000002', '{"size": 1000}'::jsonb);

reset role;

rollback;

select 'stories_upload_quota_isolation_ok' as result;
