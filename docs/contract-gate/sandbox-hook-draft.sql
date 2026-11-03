-- Definition only, not applied. Review existing hooks and privileges first.
-- This declares a write shape; it does not authenticate or authorize a user.
begin;
create schema if not exists private;
create or replace function private.enforce_api_contract_gate()
returns void language plpgsql security invoker
set search_path = pg_catalog
as $gate$
declare
  method text := current_setting('request.method', true);
  route text := current_setting('request.path', true);
  headers jsonb;
begin
  if route in ('/throughline_entries', '/oki_messages')
     and method in ('POST', 'PUT', 'PATCH', 'DELETE') then
    headers := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
    if coalesce(headers->>'x-incommon-write-contract', '') <> 'v2-composite-upsert' then
      raise exception 'Client upgrade required'
        using errcode = 'PT423', detail = 'CLIENT_UPGRADE_REQUIRED';
    end if;
  end if;
end
$gate$;
revoke all on function private.enforce_api_contract_gate() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.enforce_api_contract_gate() to anon, authenticated;
commit;

-- Deliberately no ALTER ROLE or reload here. After effective existing-hook
-- inspection, compose a reviewed wrapper that calls both checks. Only then
-- bind the composed function through authenticator and request config reload.
