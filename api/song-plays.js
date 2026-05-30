const { getPool } = require('./_lib/db');
const { rowToCamel } = require('./_lib/camel');
const { setCors, sendJson, readBody } = require('./_lib/http');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const pool = getPool();

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM song_plays ORDER BY id');
      return sendJson(
        res,
        200,
        rows.map((r) => rowToCamel(r, 'songPlays')),
      );
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const songId = Number(body.songId);
      if (!songId) {
        return sendJson(res, 400, { message: 'songId is required' });
      }

      const { rows } = await pool.query(
        `INSERT INTO song_plays (song_id, user_id, played_at, duration, listened_seconds)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          songId,
          body.userId ?? null,
          body.playedAt || new Date().toISOString(),
          Number(body.duration) || 0,
          Number(body.listenedSeconds) || 0,
        ],
      );

      await pool.query(
        `UPDATE songs SET play_count = COALESCE(play_count, 0) + 1 WHERE id = $1`,
        [songId],
      );

      return sendJson(res, 201, rowToCamel(rows[0], 'songPlays'));
    }

    return sendJson(res, 405, { message: '不支援的 HTTP 方法' });
  } catch (error) {
    console.error('[api/song-plays]', error);
    return sendJson(res, 500, { message: error.message || '伺服器錯誤' });
  }
};
