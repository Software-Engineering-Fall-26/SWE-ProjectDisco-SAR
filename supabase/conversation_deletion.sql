-- Run this once in the Supabase SQL Editor after the messaging tables exist.
-- It hides a conversation only for the current user. A reply from another
-- participant restores it to that user's inbox.

alter table public.conversation_members
  add column if not exists deleted_at timestamptz;

-- Repair memberships removed by the first delete implementation. If a former
-- participant sent a message, restore their membership in a hidden state so
-- the remaining participant can still see the correct profile/name.
insert into public.conversation_members (
  conversation_id,
  user_id,
  joined_at,
  deleted_at
)
select
  messages.conversation_id,
  messages.sender_id,
  min(messages.created_at),
  now()
from public.messages
where not exists (
  select 1
  from public.conversation_members
  where conversation_members.conversation_id = messages.conversation_id
    and conversation_members.user_id = messages.sender_id
)
group by messages.conversation_id, messages.sender_id
on conflict (conversation_id, user_id) do nothing;

create or replace function public.delete_conversation_for_current_user(
  p_conversation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversation_members
  set deleted_at = now()
  where conversation_id = p_conversation_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Conversation not found or you are not a participant.';
  end if;
end;
$$;

create or replace function public.restore_conversation_for_recipients()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversation_members
  set deleted_at = null
  where conversation_id = new.conversation_id
    and user_id <> new.sender_id
    and deleted_at is not null;

  return new;
end;
$$;

drop trigger if exists restore_conversation_after_message on public.messages;
create trigger restore_conversation_after_message
  after insert on public.messages
  for each row
  execute function public.restore_conversation_for_recipients();

revoke all on function public.delete_conversation_for_current_user(uuid) from public;
grant execute on function public.delete_conversation_for_current_user(uuid) to authenticated;
