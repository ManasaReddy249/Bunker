-- OPTIONAL demo seed for B3A-S7-T1
-- This script is NOT executed by the application.
-- Do not run it unless you explicitly want demo rows in the application tables.
-- Recommended: keep DEMO_MODE=true and use in-memory/CSV demo data instead.
--
-- Prerequisites:
--   1. Application tables are empty (or you accept ID collisions).
--   2. CSV files are reachable by SQL Server (this example uses BULK INSERT).
--   3. Demo login users should be created with backend/scripts/seed-demo-users.js
--      so passwords are bcrypt hashes, not CSV placeholders.
--
-- Staging tables dbo.[USER] and dbo.ADMIN_REVIEW are intentionally untouched.

/*
Example typed insert (Users). Replace the hash with a bcrypt hash from seed-demo-users.js.

INSERT INTO dbo.Users (user_id, username, email, password_hash, role, is_active)
VALUES (90001, 'admin', 'admin@bunkersmart.local', '<bcrypt-hash>', 'Administrator', 1);
*/

PRINT 'seed-demo.sql is a reference file. Use backend DEMO_MODE or scripts/seed-demo-users.js.';
