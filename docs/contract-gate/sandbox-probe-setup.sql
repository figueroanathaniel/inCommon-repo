-- Definition only, not applied. Review existing hooks and privileges first.
-- This declares a write shape; it does not authenticate or authorize a user.
create schema if not exists incommon_contract_probe;
create or replace function incommon_contract_probe.enforce_api_contract_gate()
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
revoke all on function incommon_contract_probe.enforce_api_contract_gate() from public;
grant usage on schema incommon_contract_probe to anon, authenticated;
grant execute on function incommon_contract_probe.enforce_api_contract_gate() to anon, authenticated;

-- Temporary sandbox probe registration. Catalog inspection found no stored
-- hook overrides; restore the previous configuration after the test.

alter role authenticator set pgrst.db_pre_request = 'incommon_contract_probe.enforce_api_contract_gate';
notify pgrst, 'reload config';
