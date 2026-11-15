-- Run as a PostgreSQL administrator. Change example passwords first.
DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='stockvault_readonly') THEN
  CREATE ROLE stockvault_readonly LOGIN PASSWORD 'CHANGE_THIS_READONLY_PASSWORD';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='stockvault_manager') THEN
  CREATE ROLE stockvault_manager LOGIN PASSWORD 'CHANGE_THIS_MANAGER_PASSWORD';
 END IF;
END $$;
GRANT CONNECT ON DATABASE stockvault_db TO stockvault_readonly,stockvault_manager;
GRANT USAGE ON SCHEMA stockvault TO stockvault_readonly,stockvault_manager;
GRANT SELECT ON ALL TABLES IN SCHEMA stockvault TO stockvault_readonly;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA stockvault TO stockvault_manager;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA stockvault TO stockvault_manager;
ALTER DEFAULT PRIVILEGES IN SCHEMA stockvault GRANT SELECT ON TABLES TO stockvault_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA stockvault
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLES TO stockvault_manager;
-- Example: REVOKE DELETE ON ALL TABLES IN SCHEMA stockvault FROM stockvault_manager;
