-- Report and filter public ideas.
-- Run this after supabase/public_idea_board.sql.
-- If you rerun public_idea_board.sql later, run this file again so the
-- public-read policy still hides reported ideas.

alter table public.ideas
  add column if not exists moderation_status text not null default 'visible';

alter table public.ideas
  add column if not exists moderation_reason text not null default '';

alter table public.ideas
  drop constraint if exists ideas_moderation_status_check;

alter table public.ideas
  add constraint ideas_moderation_status_check
  check (moderation_status in ('visible', 'hidden'));

create table if not exists public.idea_reports (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text not null,
  details text not null default '',
  created_at timestamptz not null default now(),
  unique (idea_id, reporter_id),
  constraint idea_reports_reason_check check (
    reason in (
      'Hate speech',
      'Harassment or threats',
      'Sexual content',
      'Violence',
      'Illegal activity',
      'Spam or scam',
      'Something else'
    )
  ),
  constraint idea_reports_details_length_check check (char_length(details) <= 500)
);

create index if not exists idea_reports_idea_id_idx
  on public.idea_reports (idea_id);

alter table public.idea_reports enable row level security;

drop policy if exists "Users can report a public idea" on public.idea_reports;
create policy "Users can report a public idea"
  on public.idea_reports
  for insert
  to authenticated
  with check (
    auth.uid() = reporter_id
    and exists (
      select 1
      from public.ideas
      where ideas.id = idea_id
        and ideas.is_public = true
        and ideas.user_id <> auth.uid()
        and ideas.moderation_status = 'visible'
    )
  );

drop policy if exists "Users can view their own reports" on public.idea_reports;
create policy "Users can view their own reports"
  on public.idea_reports
  for select
  to authenticated
  using (auth.uid() = reporter_id);

-- Clients can update their own ideas, so lock the moderation columns unless
-- this report trigger explicitly opens a write for the current transaction.
create or replace function public.lock_idea_moderation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.moderation_status := 'visible';
    new.moderation_reason := '';
    return new;
  end if;

  if current_setting('disco.moderation_write', true) is distinct from 'on' then
    new.moderation_status := old.moderation_status;
    new.moderation_reason := old.moderation_reason;
  end if;

  return new;
end;
$$;

drop trigger if exists ideas_lock_moderation on public.ideas;
create trigger ideas_lock_moderation
before insert or update on public.ideas
for each row
execute function public.lock_idea_moderation();

create or replace function public.hide_reported_idea()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('disco.moderation_write', 'on', true);

  update public.ideas
  set
    moderation_status = 'hidden',
    moderation_reason =
      'Reported for ' || new.reason || '. It stays off the Idea Board.'
  where id = new.idea_id;

  return new;
end;
$$;

drop trigger if exists idea_reports_hide_idea on public.idea_reports;
create trigger idea_reports_hide_idea
after insert on public.idea_reports
for each row
execute function public.hide_reported_idea();

drop policy if exists "Authenticated users can view public ideas" on public.ideas;
create policy "Authenticated users can view public ideas"
  on public.ideas
  for select
  to authenticated
  using (is_public = true and moderation_status = 'visible');

grant select, insert on public.idea_reports to authenticated;
revoke all on public.idea_reports from anon;
