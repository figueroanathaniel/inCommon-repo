alter role authenticator reset pgrst.db_pre_request;
drop function incommon_contract_probe.enforce_api_contract_gate();
drop schema incommon_contract_probe;
notify pgrst, 'reload config';
