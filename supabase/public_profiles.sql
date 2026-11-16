-- Public member pages. Run after profiles.sql and the social-account migration.
-- Only authenticated users can view a profile that its owner marked public.

drop policy if exists "Authenticated users can view public profiles" on public.profiles;
create policy "Authenticated users can view public profiles"
  on public.profiles
  for select
  to authenticated
  using (is_public = true);

-- Avatars remain private except when their owner's profile is public.
drop policy if exists "Authenticated users can read public profile avatars" on storage.objects;
create policy "Authenticated users can read public profile avatars"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and exists (
      select 1
      from public.profiles
      where profiles.id::text = (storage.foldername(name))[1]
        and profiles.is_public = true
    )
  );

-- This project stores only LinkedIn connection metadata in social_accounts.
-- It can be read for a member only when that member's profile is public.
drop policy if exists "Authenticated users can view public LinkedIn connections" on public.social_accounts;
create policy "Authenticated users can view public LinkedIn connections"
  on public.social_accounts
  for select
  to authenticated
  using (
    provider = 'linkedin'
    and exists (
      select 1
      from public.profiles
      where profiles.id = social_accounts.user_id
        and profiles.is_public = true
    )
  );
