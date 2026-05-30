/**
 * 在 Neon 建立資料表
 * 使用：node scripts/init-db.js
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('請在 .env 設定 DATABASE_URL');
    process.exit(1);
  }

  const schemaPath = path.join(__dirname, '..', 'api', '_lib', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const pool = new Pool({ connectionString: url });
  await pool.query(schema);
  await pool.end();
  console.log('✅ 資料表建立完成');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
