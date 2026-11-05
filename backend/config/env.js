const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true' || value === '1';
}

const env = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  demoMode: bool(process.env.DEMO_MODE, false),
  db: {
    server: process.env.DB_SERVER || 'INBAAVVMMARSSQL',
    database: process.env.DB_DATABASE || 'B3A-S7-T1',
    driver: process.env.DB_DRIVER || 'msnodesqlv8',
    encrypt: bool(process.env.DB_ENCRYPT, true),
    trustServerCertificate: bool(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
    connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 15000),
    requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT_MS || 30000),
    odbcDriver: process.env.ODBC_DRIVER || 'ODBC Driver 17 for SQL Server'
  }
};

module.exports = env;
