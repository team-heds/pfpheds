-- Le fil, les places de stage et les tâches ne sont utilisés que par des pages connectées.
-- Le backend y accède avec sa clé de service, qui n'est pas concernée.
revoke all privileges on table public.posts from anon;
revoke all privileges on table public.post_media from anon;
revoke all privileges on table public.places from anon;
revoke all privileges on table public.todos from anon;

notify pgrst, 'reload schema';
