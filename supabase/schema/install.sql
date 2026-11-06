-- install.sql — Fresh empty Supabase project only; never run over existing tables.
BEGIN;
\ir 01-tables.sql
\ir 02-constraints-indexes.sql
\ir 03-functions-1.sql
\ir 03-functions-2.sql
\ir 03-functions-3.sql
\ir 03-functions-4.sql
\ir 03-functions-5.sql
\ir 03-functions-6.sql
\ir 04-policies-triggers.sql
COMMIT;
