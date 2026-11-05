const sql = require('mssql/msnodesqlv8');
const env = require('./env');

let pool;

function buildConfig() {
  const driverName = env.db.odbcDriver;
  const connectionString = [
    `Driver={${driverName}}`,
    `Server=${env.db.server}`,
    `Database=${env.db.database}`,
    'Trusted_Connection=Yes',
    'TrustServerCertificate=Yes'
  ].join(';');

  return {
    connectionString,
    driver: 'msnodesqlv8',
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    connectionTimeout: env.db.connectionTimeout,
    requestTimeout: env.db.requestTimeout,
    options: {
      trustedConnection: true,
      trustServerCertificate: env.db.trustServerCertificate,
      encrypt: env.db.encrypt,
      enableArithAbort: true
    }
  };
}

async function getPool() {
  if (env.demoMode) {
    throw new Error('SQL pool requested while DEMO_MODE=true');
  }
  if (pool && pool.connected) return pool;
  pool = new sql.ConnectionPool(buildConfig());
  pool.on('error', (err) => {
    console.error('SQL pool error:', err.message);
  });
  await pool.connect();
  return pool;
}

async function testConnection() {
  const started = Date.now();
  const p = await getPool();
  const result = await p.request().query('SELECT DB_NAME() AS db_name, @@SERVERNAME AS server_name, SUSER_SNAME() AS login_name, GETDATE() AS server_time');
  return { ok: true, elapsedMs: Date.now() - started, ...result.recordset[0] };
}

async function query(text, inputs = []) {
  const p = await getPool();
  const request = p.request();
  for (const input of inputs) {
    if (input.type) request.input(input.name, input.type, input.value);
    else request.input(input.name, input.value);
  }
  return request.query(text);
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = { sql, getPool, testConnection, query, closePool, buildConfig };
