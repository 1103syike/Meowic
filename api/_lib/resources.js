const { getPool } = require('./db');
const { TABLE_NAMES, rowToCamel, bodyToColumns } = require('./camel');
const { applyExpand, parseExpand } = require('./expand');

const FILTER_COLUMNS = {
  users: ['id', 'email', 'phone'],
  artists: ['id'],
  albums: ['id', 'artist_id'],
  songs: ['id', 'album_id', 'artist_id'],
  playlists: ['id', 'user_id'],
  playlistUsers: ['id', 'playlist_id', 'user_id'],
  playlistSongs: ['id', 'playlist_id', 'song_id'],
  advertisements: ['id'],
};

const CAMEL_FILTER_KEYS = {
  artistId: 'artist_id',
  albumId: 'album_id',
  userId: 'user_id',
  playlistId: 'playlist_id',
  songId: 'song_id',
};

function resolveResource(name) {
  if (!name || !TABLE_NAMES[name]) {
    return null;
  }
  return { key: name, table: TABLE_NAMES[name] };
}

function buildFilters(resource, query) {
  const allowed = FILTER_COLUMNS[resource] || ['id'];
  const clauses = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('_') || value === undefined || value === '') continue;
    const column = CAMEL_FILTER_KEYS[key] || key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (!allowed.includes(column)) continue;
    clauses.push(`${column} = $${index++}`);
    values.push(value);
  }

  return { clauses, values };
}

async function listResource(resource, query) {
  const resolved = resolveResource(resource);
  if (!resolved) {
    return { status: 404, body: { message: '資源不存在' } };
  }

  const pool = getPool();
  const { clauses, values } = buildFilters(resolved.key, query);
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM ${resolved.table} ${where} ORDER BY id`, values);
  const expanded = await applyExpand(resolved.key, rows, parseExpand(query));
  return { status: 200, body: expanded };
}

async function getById(resource, id) {
  const resolved = resolveResource(resource);
  if (!resolved) {
    return { status: 404, body: { message: '資源不存在' } };
  }

  const pool = getPool();
  const { rows } = await pool.query(`SELECT * FROM ${resolved.table} WHERE id = $1`, [id]);
  if (!rows.length) {
    return { status: 404, body: { message: '找不到資料' } };
  }

  const [expanded] = await applyExpand(resolved.key, rows, []);
  return { status: 200, body: expanded };
}

async function createResource(resource, body) {
  const resolved = resolveResource(resource);
  if (!resolved) {
    return { status: 404, body: { message: '資源不存在' } };
  }

  const columns = bodyToColumns(resolved.key, body);
  const keys = Object.keys(columns);
  if (!keys.length) {
    return { status: 400, body: { message: '缺少欄位' } };
  }

  const placeholders = keys.map((_, i) => `$${i + 1}`);
  const values = keys.map((k) => columns[k]);
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO ${resolved.table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    values,
  );

  const [created] = await applyExpand(resolved.key, rows, []);
  return { status: 201, body: created };
}

async function updateResource(resource, id, body) {
  const resolved = resolveResource(resource);
  if (!resolved) {
    return { status: 404, body: { message: '資源不存在' } };
  }

  const columns = bodyToColumns(resolved.key, body);
  const keys = Object.keys(columns);
  if (!keys.length) {
    return { status: 400, body: { message: '缺少欄位' } };
  }

  const sets = keys.map((k, i) => `${k} = $${i + 2}`);
  const values = [id, ...keys.map((k) => columns[k])];
  const pool = getPool();
  const { rows } = await pool.query(
    `UPDATE ${resolved.table} SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    values,
  );

  if (!rows.length) {
    return { status: 404, body: { message: '找不到資料' } };
  }

  const [updated] = await applyExpand(resolved.key, rows, []);
  return { status: 200, body: updated };
}

async function deleteResource(resource, id) {
  const resolved = resolveResource(resource);
  if (!resolved) {
    return { status: 404, body: { message: '資源不存在' } };
  }

  const pool = getPool();
  const { rowCount } = await pool.query(`DELETE FROM ${resolved.table} WHERE id = $1`, [id]);
  if (!rowCount) {
    return { status: 404, body: { message: '找不到資料' } };
  }

  return { status: 204, body: null };
}

module.exports = {
  listResource,
  getById,
  createResource,
  updateResource,
  deleteResource,
  resolveResource,
};
