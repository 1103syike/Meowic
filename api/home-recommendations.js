const { getPool } = require('./_lib/db');
const { rowToCamel } = require('./_lib/camel');
const { setCors, sendJson, readBody } = require('./_lib/http');

function normalizeIds(body, key) {
  const camelKey = key;
  const value = body[camelKey];
  return Array.isArray(value) ? value : [];
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const id = req.query.id ? Number(req.query.id) : null;

  try {
    const pool = getPool();

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM home_recommendations ORDER BY id');
      return sendJson(
        res,
        200,
        rows.map((r) => rowToCamel(r, 'homeRecommendations')),
      );
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const { rows } = await pool.query(
        `INSERT INTO home_recommendations (popular_song_ids, popular_artist_ids, popular_album_ids)
         VALUES ($1::jsonb, $2::jsonb, $3::jsonb)
         RETURNING *`,
        [
          JSON.stringify(normalizeIds(body, 'popularSongIds')),
          JSON.stringify(normalizeIds(body, 'popularArtistIds')),
          JSON.stringify(normalizeIds(body, 'popularAlbumIds')),
        ],
      );
      return sendJson(res, 201, rowToCamel(rows[0], 'homeRecommendations'));
    }

    if (req.method === 'PATCH' && id) {
      const body = await readBody(req);
      const { rows } = await pool.query(
        `UPDATE home_recommendations
         SET popular_song_ids = $2::jsonb,
             popular_artist_ids = $3::jsonb,
             popular_album_ids = $4::jsonb
         WHERE id = $1
         RETURNING *`,
        [
          id,
          JSON.stringify(normalizeIds(body, 'popularSongIds')),
          JSON.stringify(normalizeIds(body, 'popularArtistIds')),
          JSON.stringify(normalizeIds(body, 'popularAlbumIds')),
        ],
      );

      if (!rows.length) {
        return sendJson(res, 404, { message: '首頁推薦不存在' });
      }

      return sendJson(res, 200, rowToCamel(rows[0], 'homeRecommendations'));
    }

    return sendJson(res, 405, { message: '不支援的 HTTP 方法' });
  } catch (error) {
    console.error('[api/home-recommendations]', error);
    return sendJson(res, 500, { message: error.message || '伺服器錯誤' });
  }
};
