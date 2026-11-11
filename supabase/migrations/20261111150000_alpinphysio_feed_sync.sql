-- Alp'in Physio : la publication du fil d'actualité liée à un événement est
-- désormais tenue à jour par la base elle-même.
--
-- Avant : le navigateur du responsable écrivait la publication. Les règles de
-- public.posts (auth.uid() = user_id) empêchaient alors un second responsable
-- de mettre à jour ou de retirer la publication créée par un collègue.
-- Après : un déclencheur sur public.events crée, met à jour ou retire la
-- publication, quel que soit le responsable qui modifie l'événement.
-- La publication garde pour auteur le créateur de l'événement.

create or replace function public.alpinphysio_html_escape(p_value text)
returns text
language sql
immutable
set search_path = pg_catalog
as $$
  select replace(replace(replace(replace(replace(coalesce(p_value, ''),
    '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;'), '''', '&#39;');
$$;

revoke all on function public.alpinphysio_html_escape(text) from public, anon, authenticated;

create or replace function public.sync_alpinphysio_event_feed_post()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_author uuid;
  v_content text;
begin
  if new.type is distinct from 'alpinphysio' then
    return new;
  end if;

  if new.status is distinct from 'published' or not coalesce(new.show_in_feed, false) then
    delete from public.posts where event_id = new.id;
    return new;
  end if;

  -- admin_uid est un texte hérité : on ne publie que pour un compte existant.
  select u.id into v_author
  from auth.users u
  where u.id::text = new.admin_uid;
  if v_author is null then
    return new;
  end if;

  v_content := format(
    '<p><strong>%s</strong></p><p>%s%s</p><p>%s</p><p><a href="/events">Répondre à l’événement</a></p>',
    public.alpinphysio_html_escape(new.title),
    to_char(new.start_date at time zone 'Europe/Zurich', 'DD.MM.YYYY "à" HH24:MI'),
    case when nullif(btrim(new.lieu), '') is null then ''
         else ' · ' || public.alpinphysio_html_escape(new.lieu) end,
    public.alpinphysio_html_escape(new.description)
  );

  insert into public.posts (event_id, user_id, author_name, content, hashtags, mentions, community_id)
  values (
    new.id, v_author, 'Alp''in Physio', v_content,
    '{"alpinphysio": true, "evenement": true}'::jsonb, '{}'::jsonb, null
  )
  on conflict (event_id) do update
    set content = excluded.content,
        author_name = excluded.author_name,
        hashtags = excluded.hashtags;

  return new;
end;
$$;

revoke all on function public.sync_alpinphysio_event_feed_post() from public, anon, authenticated;

create or replace trigger alpinphysio_event_feed_post_sync
after insert or update of title, description, lieu, start_date, status, show_in_feed, type
on public.events
for each row execute function public.sync_alpinphysio_event_feed_post();
