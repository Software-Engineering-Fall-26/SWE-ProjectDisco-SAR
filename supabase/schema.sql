create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ideas_user_id_idx on public.ideas (user_id);
create index if not exists ideas_created_at_idx on public.ideas (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at
before update on public.ideas
for each row
execute function public.set_updated_at();

alter table public.ideas enable row level security;

drop policy if exists "Users can view their own ideas" on public.ideas;
create policy "Users can view their own ideas"
  on public.ideas
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own ideas" on public.ideas;
create policy "Users can insert their own ideas"
  on public.ideas
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own ideas" on public.ideas;
create policy "Users can update their own ideas"
  on public.ideas
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own ideas" on public.ideas;
create policy "Users can delete their own ideas"
  on public.ideas
  for delete
  to authenticated
  using (auth.uid() = user_id);
