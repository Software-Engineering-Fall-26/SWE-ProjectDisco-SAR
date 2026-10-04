create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  description text not null default '',
  avatar_path text,
  topics text[] not null default '{}',
  is_public boolean not null default false,
  message_permission boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

  create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', '')
  );

  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;

create trigger create_profile_after_signup
  after insert on auth.users
  for each row
  execute function public.create_profile_for_new_user();

  insert into public.profiles (id, display_name)
select
  id,
  coalesce(raw_user_meta_data ->> 'username', '')
from auth.users
on conflict (id) do nothing;