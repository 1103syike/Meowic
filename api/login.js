const jwt = require('jsonwebtoken');
const { getPool } = require('./_lib/db');
const { rowToCamel } = require('./_lib/camel');
const { setCors, sendJson, readBody } = require('./_lib/http');

const EXPIRES_IN = '7d';

function getSecret() {
  return process.env.JWT_SECRET || 'MEOWIC_DEV_SECRET_CHANGE_IN_PRODUCTION';
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { message: '僅支援 POST' });
  }

  try {
    const { account, email, password } = await readBody(req);
    const identifier = (account || email || '').trim();
    if (!identifier || !password) {
      return sendJson(res, 400, { message: '請輸入帳號與密碼' });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE (email = $1 OR phone = $1) AND password = $2 LIMIT 1`,
      [identifier, password],
    );

    if (!rows.length) {
      return sendJson(res, 401, { message: '帳號或密碼錯誤' });
    }

    const user = rowToCamel(rows[0], 'users');
    const accessToken = jwt.sign(
      {
        id: user.id,
        account: user.email || user.phone,
        email: user.email,
        phone: user.phone,
      },
      getSecret(),
      { expiresIn: EXPIRES_IN },
    );

    return sendJson(res, 200, { accessToken });
  } catch (error) {
    console.error('[api/login]', error);
    return sendJson(res, 500, { message: error.message || '伺服器錯誤' });
  }
};
