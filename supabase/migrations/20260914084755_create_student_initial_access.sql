-- HEDS25-599: server-only tracking for student initial-access invitations.
-- This schema deliberately stores no email address, password, OTP, recovery URL or token.

create table public.student_initial_access (
  user_id uuid primary key references public.user_profiles(user_id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'used', 'expired', 'error')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_sent_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz,
  last_error_code text
    check (last_error_code is null or last_error_code in (
      'auth_account_missing',
      'auth_email_missing',
      'delivery_failed',
      'provider_unavailable'
    )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,
  check (status <> 'sent' or (last_sent_at is not null and expires_at is not null)),
  check (status <> 'used' or used_at is not null),
  check (status <> 'error' or last_error_code is not null)
);

create index student_initial_access_status_idx
  on public.student_initial_access (status, updated_at desc);

comment on table public.student_initial_access is
  'Server-only current state for a student initial-access invitation; contains no secret or email.';
comment on column public.student_initial_access.last_error_code is
  'Allow-listed operational category only; never store provider messages or personal data.';

alter table public.student_initial_access enable row level security;
revoke all on table public.student_initial_access from public, anon, authenticated;
revoke all on table public.student_initial_access from service_role;
grant select, insert, update on table public.student_initial_access to service_role;

create table public.student_initial_access_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.student_initial_access(user_id) on delete cascade,
  event_type text not null
    check (event_type in ('pending', 'sent', 'resent', 'used', 'expired', 'error')),
  actor_user_id uuid,
  request_id text check (request_id is null or char_length(request_id) between 1 and 128),
  error_code text
    check (error_code is null or error_code in (
      'auth_account_missing',
      'auth_email_missing',
      'delivery_failed',
      'provider_unavailable'
    )),
  created_at timestamptz not null default now(),
  check (event_type <> 'error' or error_code is not null)
);

create index student_initial_access_events_user_created_idx
  on public.student_initial_access_events (user_id, created_at desc);

comment on table public.student_initial_access_events is
  'Append-only server audit trail for initial access; contains no secret, URL, password or email.';

alter table public.student_initial_access_events enable row level security;
revoke all on table public.student_initial_access_events from public, anon, authenticated;
revoke all on table public.student_initial_access_events from service_role;
grant select, insert on table public.student_initial_access_events to service_role;
