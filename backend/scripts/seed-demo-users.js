/**
 * Upserts the three bcrypt-hashed demo login accounts into dbo.Users.
 * Does not touch staging dbo.[USER] or any business tables.
 * Safe to re-run: existing accounts are updated by their reserved demo IDs.
 */
const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { DEMO_ACCOUNTS } = require('../data/demoAccounts');

async function main() {
  if (env.demoMode) {
    console.log('DEMO_MODE=true — demo accounts already exist in the in-memory store. Nothing written to SQL.');
    return;
  }
  const { sql, query, closePool } = require('../config/db');
  try {
    for (const account of DEMO_ACCOUNTS) {
      const existing = await query('SELECT user_id FROM dbo.Users WHERE username=@username OR email=@email OR user_id=@user_id', [
        { name: 'username', type: sql.VarChar(100), value: account.username },
        { name: 'email', type: sql.VarChar(150), value: account.email },
        { name: 'user_id', type: sql.Int, value: account.user_id }
      ]);
      const reservedAccount = existing.recordset.find((row) => row.user_id === account.user_id);
      if (reservedAccount) {
        const hash = await bcrypt.hash(account.password, 10);
        await query(
          `UPDATE dbo.Users SET username=@username, email=@email, password_hash=@password_hash, role=@role, is_active=1
           WHERE user_id=@user_id`,
          [
            { name: 'user_id', type: sql.Int, value: account.user_id },
            { name: 'username', type: sql.VarChar(100), value: account.username },
            { name: 'email', type: sql.VarChar(150), value: account.email },
            { name: 'password_hash', type: sql.VarChar(255), value: hash },
            { name: 'role', type: sql.VarChar(40), value: account.role }
          ]
        );
        console.log(`Updated ${account.username} (${account.role})`);
        continue;
      }
      if (existing.recordset.length) {
        console.log(`Skip existing ${account.username}`);
        continue;
      }
      const hash = await bcrypt.hash(account.password, 10);
      await query(
        `INSERT INTO dbo.Users (user_id, username, email, password_hash, role, is_active)
         VALUES (@user_id, @username, @email, @password_hash, @role, 1)`,
        [
          { name: 'user_id', type: sql.Int, value: account.user_id },
          { name: 'username', type: sql.VarChar(100), value: account.username },
          { name: 'email', type: sql.VarChar(150), value: account.email },
          { name: 'password_hash', type: sql.VarChar(255), value: hash },
          { name: 'role', type: sql.VarChar(40), value: account.role }
        ]
      );
      console.log(`Inserted ${account.username} (${account.role})`);
    }
    console.log('Done. These accounts are distinct from imported dbo.[USER] rows.');
  } finally {
    await closePool();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
