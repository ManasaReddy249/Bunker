const env = require('../config/env');
const { query, closePool } = require('../config/db');

async function main() {
  if (env.demoMode) {
    console.log('Set DEMO_MODE=false to inspect SQL Server.');
    return;
  }
  const tables = await query(`
    SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME`);
  console.log('Tables:');
  console.table(tables.recordset);
  const cols = await query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='dbo' ORDER BY TABLE_NAME, ORDINAL_POSITION`);
  console.log('Columns:');
  console.table(cols.recordset);
  await closePool();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
