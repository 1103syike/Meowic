const { getPool } = require('./db');
const { rowToCamel } = require('./camel');

const EXPAND_CONFIG = {
  songs: {
    album: { table: 'albums', fk: 'album_id', resource: 'albums' },
    artist: { table: 'artists', fk: 'artist_id', resource: 'artists' },
  },
  albums: {
    artist: { table: 'artists', fk: 'artist_id', resource: 'artists' },
  },
  playlists: {
    user: { table: 'users', fk: 'user_id', resource: 'users' },
  },
  playlistUsers: {
    user: { table: 'users', fk: 'user_id', resource: 'users' },
    playlist: { table: 'playlists', fk: 'playlist_id', resource: 'playlists' },
  },
  playlistSongs: {
    song: { table: 'songs', fk: 'song_id', resource: 'songs' },
  },
};

async function fetchByIds(table, ids) {
  if (!ids.length) return new Map();
  const pool = getPool();
  const unique = [...new Set(ids.filter(Boolean))];
  const { rows } = await pool.query(`SELECT * FROM ${table} WHERE id = ANY($1::int[])`, [unique]);
  const map = new Map();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

async function applyExpand(resource, rows, expandList) {
  const config = EXPAND_CONFIG[resource];
  if (!config || !expandList.length) {
    return rows.map((r) => rowToCamel(r, resource));
  }

  const camelRows = rows.map((r) => rowToCamel(r, resource));
  const relatedMaps = {};

  for (const expandKey of expandList) {
    const rel = config[expandKey];
    if (!rel) continue;
    const ids = rows.map((r) => r[rel.fk]).filter(Boolean);
    const rawMap = await fetchByIds(rel.table, ids);
    relatedMaps[expandKey] = new Map();
    for (const [id, raw] of rawMap.entries()) {
      relatedMaps[expandKey].set(id, rowToCamel(raw, rel.resource));
    }
  }

  return camelRows.map((row, index) => {
    const enriched = { ...row };
    for (const expandKey of expandList) {
      const rel = config[expandKey];
      if (!rel) continue;
      const fkValue = rows[index][rel.fk];
      enriched[expandKey] = relatedMaps[expandKey]?.get(fkValue) ?? null;
    }
    return enriched;
  });
}

function parseExpand(query) {
  const raw = query._expand;
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .flatMap((part) => String(part).split(','))
    .map((s) => s.replace(/^_expand=/, '').trim())
    .filter(Boolean);
}

module.exports = { applyExpand, parseExpand };
