const { Pool, neon } = require('@neondatabase/serverless');

let pool;
let sqlTag;

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL 未設定，請在 Vercel / .env 加入 Neon 連線字串');
    }
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

function getSql() {
  if (!sqlTag) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL 未設定');
    }
    sqlTag = neon(url);
  }
  return sqlTag;
}

module.exports = { getPool, getSql };
