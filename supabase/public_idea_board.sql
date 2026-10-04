-- Idea Board. Run this after supabase/schema.sql on the existing database.
-- Ideas stay private until the owner sets is_public.

alter table public.ideas add column if not exists looking_for text not null default '';
alter table public.ideas add column if not exists is_public boolean not null default false;
alter table public.ideas add column if not exists author_username text not null default '';

create index if not exists ideas_public_created_at_idx
  on public.ideas (created_at desc)
  where is_public = true;

-- Keep ownership and the displayed name on the server so a client cannot
-- assign an idea to someone else or impersonate another member.
create or replace function public.set_idea_owner_fields()
returns trigger
language plpgsql
as $$
declare
  username text;
begin
  username := coalesce(auth.jwt() -> 'user_metadata' ->> 'username', '');

  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.author_username := username;
  else
    new.user_id := old.user_id;

    if username <> '' then
      new.author_username := username;
    else
      new.author_username := old.author_username;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists ideas_set_owner_fields on public.ideas;
create trigger ideas_set_owner_fields
before insert or update on public.ideas
for each row
execute function public.set_idea_owner_fields();

drop policy if exists "Authenticated users can view public ideas" on public.ideas;
create policy "Authenticated users can view public ideas"
  on public.ideas
  for select
  to authenticated
  using (is_public = true);
