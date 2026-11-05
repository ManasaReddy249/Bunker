const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { testConnection, closePool } = require('./config/db');

const app = express();
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

async function start() {
  console.log(`BunkerSmart API starting (DEMO_MODE=${env.demoMode})`);
  if (!env.demoMode) {
    try {
      const info = await testConnection();
      console.log(`SQL Server connected: ${info.server_name} / ${info.db_name} as ${info.login_name}`);
    } catch (err) {
      console.error('SQL Server connection failed:', err.message);
      console.error('Fix the connection or set DEMO_MODE=true in backend/.env');
      process.exit(1);
    }
  } else {
    console.log('Running with in-memory CSV demo repositories. SQL tables will not be written.');
  }

  const server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });

  const shutdown = async () => {
    server.close();
    if (!env.demoMode) await closePool();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
