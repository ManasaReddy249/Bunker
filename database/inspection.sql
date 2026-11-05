-- BunkerSmart schema inspection (read-only)
-- Database: B3A-S7-T1
-- Do not DROP, ALTER, or TRUNCATE tables from this script.

SET NOCOUNT ON;

PRINT '=== Tables ===';
SELECT TABLE_SCHEMA, TABLE_NAME, TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES
ORDER BY TABLE_SCHEMA, TABLE_NAME;

PRINT '=== Columns ===';
SELECT TABLE_NAME, ORDINAL_POSITION, COLUMN_NAME, DATA_TYPE,
       CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME, ORDINAL_POSITION;

PRINT '=== Primary / Unique / Foreign keys ===';
SELECT tc.TABLE_NAME, kc.COLUMN_NAME, tc.CONSTRAINT_TYPE, tc.CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kc
  ON tc.CONSTRAINT_NAME = kc.CONSTRAINT_NAME
 AND tc.TABLE_SCHEMA = kc.TABLE_SCHEMA
ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_TYPE, kc.ORDINAL_POSITION;

PRINT '=== Foreign key targets ===';
SELECT fk.name AS fk_name,
       OBJECT_NAME(fk.parent_object_id) AS table_name,
       COL_NAME(fc.parent_object_id, fc.parent_column_id) AS column_name,
       OBJECT_NAME(fk.referenced_object_id) AS referenced_table,
       COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS referenced_column
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fc ON fk.object_id = fc.constraint_object_id
ORDER BY table_name, fk_name;

PRINT '=== Identity columns on user tables ===';
SELECT OBJECT_NAME(c.object_id) AS table_name, c.name AS column_name
FROM sys.columns c
JOIN sys.tables t ON c.object_id = t.object_id
WHERE c.is_identity = 1 AND t.is_ms_shipped = 0;

PRINT '=== Row counts ===';
SELECT s.name AS schema_name, t.name AS table_name, SUM(p.rows) AS row_count
FROM sys.tables t
JOIN sys.schemas s ON t.schema_id = s.schema_id
JOIN sys.partitions p ON t.object_id = p.object_id AND p.index_id IN (0, 1)
GROUP BY s.name, t.name
ORDER BY t.name;
