-- 20260424100000_client_display_order_swap_rpc.sql
-- Atomic swap of display_order between two clients (Gate 2 fix — replaces 2-UPDATE pattern)

create or replace function public.swap_client_display_order(a_id uuid, b_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a_order integer;
  b_order integer;
begin
  select display_order into a_order from public.clients where id = a_id;
  select display_order into b_order from public.clients where id = b_id;
  if a_order is null then raise exception 'Client % not found', a_id; end if;
  if b_order is null then raise exception 'Client % not found', b_id; end if;
  update public.clients set display_order = b_order where id = a_id;
  update public.clients set display_order = a_order where id = b_id;
end;
$$;

revoke execute on function public.swap_client_display_order(uuid, uuid) from public, anon, authenticated;
grant execute on function public.swap_client_display_order(uuid, uuid) to service_role;
