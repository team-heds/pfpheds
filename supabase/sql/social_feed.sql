-- Supabase Social Feed Schema + Storage + RLS
-- Execute in Supabase SQL Editor

-- Extensions
create extension if not exists "pgcrypto" with schema public;

-- Communities
create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- User communities (membership)
create table if not exists public.user_communities (
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, community_id)
);
create index if not exists idx_user_communities_user on public.user_communities(user_id);
create index if not exists idx_user_communities_comm on public.user_communities(community_id);

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  hashtags jsonb not null default '{}'::jsonb,
  mentions jsonb not null default '{}'::jsonb,
  community_id uuid null references public.communities(id) on delete set null
);
create index if not exists idx_posts_created_at on public.posts(created_at);
create index if not exists idx_posts_user on public.posts(user_id);
create index if not exists idx_posts_community on public.posts(community_id);
create index if not exists idx_posts_hashtags_gin on public.posts using gin(hashtags);

-- Post media
create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  url text not null,
  type text,
  created_at timestamptz not null default now()
);
create index if not exists idx_post_media_post on public.post_media(post_id);

-- Enable RLS
alter table public.communities enable row level security;
alter table public.user_communities enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;

-- RLS policies: communities (public read; no write unless service role)
drop policy if exists "Communities are readable by everyone" on public.communities;
create policy "Communities are readable by everyone" on public.communities
for select using (true);

-- RLS policies: user_communities
drop policy if exists "Users read own memberships" on public.user_communities;
create policy "Users read own memberships" on public.user_communities
for select using (auth.uid() = user_id);
drop policy if exists "Users insert own memberships" on public.user_communities;
create policy "Users insert own memberships" on public.user_communities
for insert with check (auth.uid() = user_id);
drop policy if exists "Users delete own memberships" on public.user_communities;
create policy "Users delete own memberships" on public.user_communities
for delete using (auth.uid() = user_id);

-- RLS policies: posts
drop policy if exists "Posts are readable by everyone" on public.posts;
create policy "Posts are readable by everyone" on public.posts
for select using (true);
drop policy if exists "Users can insert their posts" on public.posts;
create policy "Users can insert their posts" on public.posts
for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their posts" on public.posts;
create policy "Users can update their posts" on public.posts
for update using (auth.uid() = user_id);
drop policy if exists "Users can delete their posts" on public.posts;
create policy "Users can delete their posts" on public.posts
for delete using (auth.uid() = user_id);

-- RLS policies: post_media
drop policy if exists "Post media are readable by everyone" on public.post_media;
create policy "Post media are readable by everyone" on public.post_media
for select using (true);
drop policy if exists "Users can insert media for own posts" on public.post_media;
create policy "Users can insert media for own posts" on public.post_media
for insert with check (
  exists (
    select 1 from public.posts p
    where p.id = post_id and p.user_id = auth.uid()
  )
);
drop policy if exists "Users can update media for own posts" on public.post_media;
create policy "Users can update media for own posts" on public.post_media
for update using (
  exists (
    select 1 from public.posts p
    where p.id = post_id and p.user_id = auth.uid()
  )
);
drop policy if exists "Users can delete media for own posts" on public.post_media;
create policy "Users can delete media for own posts" on public.post_media
for delete using (
  exists (
    select 1 from public.posts p
    where p.id = post_id and p.user_id = auth.uid()
  )
);

-- Storage buckets (public read) - requires storage extension
-- Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies on storage.objects
-- Allow public read for these buckets
drop policy if exists "Public read post-media" on storage.objects;
create policy "Public read post-media" on storage.objects
for select using (bucket_id = 'post-media');
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars" on storage.objects
for select using (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder paths
drop policy if exists "Users upload to own post-media folder" on storage.objects;
create policy "Users upload to own post-media folder" on storage.objects
for insert with check (
  bucket_id = 'post-media'
  and auth.role() = 'authenticated'
  and (position(('posts/' || auth.uid()::text || '/') in name) = 1)
);
drop policy if exists "Users update own post-media" on storage.objects;
create policy "Users update own post-media" on storage.objects
for update using (
  bucket_id = 'post-media'
  and auth.role() = 'authenticated'
  and (position(('posts/' || auth.uid()::text || '/') in name) = 1)
);
drop policy if exists "Users delete own post-media" on storage.objects;
create policy "Users delete own post-media" on storage.objects
for delete using (
  bucket_id = 'post-media'
  and auth.role() = 'authenticated'
  and (position(('posts/' || auth.uid()::text || '/') in name) = 1)
);

drop policy if exists "Users upload to own avatars folder" on storage.objects;
create policy "Users upload to own avatars folder" on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (position(('users/' || auth.uid()::text || '/') in name) = 1)
);
drop policy if exists "Users update own avatars" on storage.objects;
create policy "Users update own avatars" on storage.objects
for update using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (position(('users/' || auth.uid()::text || '/') in name) = 1)
);
drop policy if exists "Users delete own avatars" on storage.objects;
create policy "Users delete own avatars" on storage.objects
for delete using (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (position(('users/' || auth.uid()::text || '/') in name) = 1)
);

-- Optional: make writes more restrictive by splitting update/delete policies if needed.
