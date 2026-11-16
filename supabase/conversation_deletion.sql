-- Run this once in the Supabase SQL Editor after the messaging tables exist.
-- It removes the current user from a conversation without deleting it for
-- the other participant or deleting shared messages.

create or replace function public.delete_conversation_for_current_user(
  p_conversation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.conversation_members
  where conversation_id = p_conversation_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Conversation not found or you are not a participant.';
  end if;
end;
$$;

revoke all on function public.delete_conversation_for_current_user(uuid) from public;
grant execute on function public.delete_conversation_for_current_user(uuid) to authenticated;
