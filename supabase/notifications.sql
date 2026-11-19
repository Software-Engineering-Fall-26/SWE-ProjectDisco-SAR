-- Run this once in the Supabase SQL Editor after the ideas, likes, and
-- collaboration-request tables exist.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  idea_id uuid references public.ideas (id) on delete set null,
  type text not null,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  idea_like boolean not null default true,
  idea_comment boolean not null default true,
  collaboration_request boolean not null default true
);

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own notification preferences" on public.notification_preferences;
create policy "Users can view their own notification preferences"
  on public.notification_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own notification preferences" on public.notification_preferences;
create policy "Users can create their own notification preferences"
  on public.notification_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own notification preferences" on public.notification_preferences;
create policy "Users can update their own notification preferences"
  on public.notification_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.notification_type_enabled(
  p_user_id uuid,
  p_notification_type text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select case p_notification_type
        when 'idea_like' then idea_like
        when 'idea_comment' then idea_comment
        when 'collaboration_request' then collaboration_request
        else true
      end
      from public.notification_preferences
      where user_id = p_user_id
    ),
    true
  );
$$;

create or replace function public.create_idea_like_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  idea_owner_id uuid;
  idea_title text;
begin
  select user_id, title
  into idea_owner_id, idea_title
  from public.ideas
  where id = new.idea_id;

  if idea_owner_id is not null
    and idea_owner_id <> new.user_id
    and public.notification_type_enabled(idea_owner_id, 'idea_like') then
    insert into public.notifications (user_id, actor_id, idea_id, type, message)
    values (
      idea_owner_id,
      new.user_id,
      new.idea_id,
      'idea_like',
      'Someone liked your idea: ' || coalesce(idea_title, 'Untitled idea')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_idea_owner_after_like on public.idea_likes;
create trigger notify_idea_owner_after_like
  after insert on public.idea_likes
  for each row
  execute function public.create_idea_like_notification();

create or replace function public.create_collaboration_request_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  idea_title text;
begin
  if new.status <> 'pending' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.status = new.status then
      return new;
    end if;
  end if;

  if new.owner_id = new.requester_id
    or not public.notification_type_enabled(new.owner_id, 'collaboration_request') then
    return new;
  end if;

  select title
  into idea_title
  from public.ideas
  where id = new.idea_id;

  insert into public.notifications (user_id, actor_id, idea_id, type, message)
  values (
    new.owner_id,
    new.requester_id,
    new.idea_id,
    'collaboration_request',
    'Someone requested to collaborate on: ' || coalesce(idea_title, 'your idea')
  );

  return new;
end;
$$;

drop trigger if exists notify_idea_owner_after_collaboration_request on public.collaboration_requests;
create trigger notify_idea_owner_after_collaboration_request
  after insert or update of status on public.collaboration_requests
  for each row
  execute function public.create_collaboration_request_notification();

create or replace function public.create_idea_comment_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  idea_owner_id uuid;
  idea_title text;
begin
  select user_id, title
  into idea_owner_id, idea_title
  from public.ideas
  where id = new.idea_id;

  if idea_owner_id is not null
    and idea_owner_id <> new.user_id
    and public.notification_type_enabled(idea_owner_id, 'idea_comment') then
    insert into public.notifications (user_id, actor_id, idea_id, type, message)
    values (
      idea_owner_id,
      new.user_id,
      new.idea_id,
      'idea_comment',
      'Someone commented on your idea: ' || coalesce(idea_title, 'Untitled idea')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_idea_owner_after_comment on public.idea_comments;
create trigger notify_idea_owner_after_comment
  after insert on public.idea_comments
  for each row
  execute function public.create_idea_comment_notification();
