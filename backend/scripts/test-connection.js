const env = require('../config/env');

async function main() {
  if (env.demoMode) {
    console.log('DEMO_MODE=true — SQL connection test skipped.');
    return;
  }
  const { testConnection, closePool } = require('../config/db');
  try {
    const info = await testConnection();
    console.log('Connection OK');
    console.log(info);
  } catch (err) {
    console.error('Connection failed:', err);
    process.exitCode = 1;
  } finally {
    await closePool().catch(() => {});
  }
}

main();
