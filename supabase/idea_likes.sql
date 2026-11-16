-- Run this once in the Supabase SQL Editor after public_idea_board.sql.
-- Each signed-in user can like a public idea once and can remove that like.

create table if not exists public.idea_likes (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, user_id)
);

create index if not exists idea_likes_idea_id_idx on public.idea_likes (idea_id);

alter table public.idea_likes enable row level security;

drop policy if exists "Users can view their own idea likes" on public.idea_likes;
create policy "Users can view their own idea likes"
  on public.idea_likes
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can like public ideas" on public.idea_likes;
create policy "Users can like public ideas"
  on public.idea_likes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.ideas
      where ideas.id = idea_likes.idea_id
        and ideas.is_public = true
    )
  );

drop policy if exists "Users can remove their own idea likes" on public.idea_likes;
create policy "Users can remove their own idea likes"
  on public.idea_likes
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.get_public_idea_like_summaries(p_idea_ids uuid[])
returns table (
  idea_id uuid,
  like_count bigint,
  liked_by_current_user boolean
)
language sql
security definer
set search_path = public
as $$
  select
    ideas.id,
    count(idea_likes.user_id),
    coalesce(bool_or(idea_likes.user_id = auth.uid()), false)
  from public.ideas
  left join public.idea_likes on idea_likes.idea_id = ideas.id
  where ideas.is_public = true
    and ideas.id = any(p_idea_ids)
  group by ideas.id;
$$;

revoke all on function public.get_public_idea_like_summaries(uuid[]) from public;
grant execute on function public.get_public_idea_like_summaries(uuid[]) to authenticated;
