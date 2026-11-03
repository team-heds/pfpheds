-- Add optional, normalized personal information to every user profile.
-- Existing rows remain valid because both columns are nullable.

alter table public.user_profiles
  add column if not exists preferred_language text,
  add column if not exists canton_of_origin text;

alter table public.user_profiles
  drop constraint if exists user_profiles_preferred_language_check,
  add constraint user_profiles_preferred_language_check
    check (preferred_language is null or preferred_language in ('fr', 'de')),
  drop constraint if exists user_profiles_canton_of_origin_check,
  add constraint user_profiles_canton_of_origin_check
    check (
      canton_of_origin is null
      or canton_of_origin in (
        'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR', 'JU',
        'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG', 'TI', 'UR',
        'VD', 'VS', 'ZG', 'ZH'
      )
    );

comment on column public.user_profiles.preferred_language is
  'Preferred interface/contact language. Allowed values: fr, de.';

comment on column public.user_profiles.canton_of_origin is
  'Swiss canton of origin stored as the official two-letter canton code.';
