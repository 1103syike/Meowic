/**
 * 從 db.json 匯入初始資料到 Neon
 * 使用：node scripts/seed.js
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('@neondatabase/serverless');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbPath = path.join(__dirname, '..', 'db.json');

async function truncateAll(pool) {
  await pool.query(`
    TRUNCATE TABLE
      song_plays,
      playlist_songs,
      playlist_users,
      playlists,
      home_recommendations,
      advertisements,
      songs,
      albums,
      artists,
      users
    RESTART IDENTITY CASCADE
  `);
}

async function seedTable(pool, table, rows, columns) {
  if (!rows?.length) return;

  for (const row of rows) {
    const values = columns.map((col) => {
      const camel = col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      const key =
        col === 'can_access_cms'
          ? 'canAccessCms'
          : col === 'img_path'
            ? 'imgPath'
            : col === 'artist_id'
              ? 'artistId'
              : col === 'album_id'
                ? 'albumId'
                : col === 'audio_path'
                  ? 'audioPath'
                  : col === 'play_count'
                    ? 'playCount'
                    : col === 'user_id'
                      ? 'userId'
                      : col === 'playlist_id'
                        ? 'playlistId'
                        : col === 'song_id'
                          ? 'songId'
                          : col === 'image_path'
                            ? 'imagePath'
                            : col === 'image_position_x'
                              ? 'imagePositionX'
                              : col === 'image_position_y'
                                ? 'imagePositionY'
                                : col === 'button_text'
                                  ? 'buttonText'
                                  : col === 'link_type'
                                    ? 'linkType'
                                    : col === 'link_target'
                                      ? 'linkTarget'
                                      : col === 'sort_order'
                                        ? 'sortOrder'
                                        : col === 'start_at'
                                          ? 'startAt'
                                          : col === 'end_at'
                                            ? 'endAt'
                                            : col === 'release_date'
                                              ? 'releaseDate'
                                              : col === 'uploaded_at'
                                                ? 'uploadedAt'
                                                : col === 'available_at'
                                                  ? 'availableAt'
                                                  : col === 'unavailable_at'
                                                    ? 'unavailableAt'
                                                    : col === 'played_at'
                                                      ? 'playedAt'
                                                      : col === 'listened_seconds'
                                                        ? 'listenedSeconds'
                                                        : col === 'popular_song_ids'
                                                          ? 'popularSongIds'
                                                          : col === 'popular_artist_ids'
                                                            ? 'popularArtistIds'
                                                            : col === 'popular_album_ids'
                                                              ? 'popularAlbumIds'
                                                              : camel;

      let value = row[key] ?? row[col];
      if (col.includes('_ids') && value) {
        value = JSON.stringify(value);
      }
      if (value === '') value = null;
      return value;
    });

    const placeholders = columns.map((_, i) => `$${i + 1}`);
    await pool.query(
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values,
    );
  }

  console.log(`  ✓ ${table}: ${rows.length} 筆`);
}

async function resetSequence(pool, table) {
  await pool.query(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1))`,
  );
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('請在 .env 設定 DATABASE_URL');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const pool = new Pool({ connectionString: url });

  console.log('清空並匯入 db.json ...');
  await truncateAll(pool);

  await seedTable(pool, 'users', data.users, [
    'id',
    'name',
    'email',
    'phone',
    'password',
    'role',
    'can_access_cms',
  ]);
  await seedTable(pool, 'artists', data.artists, ['id', 'img_path', 'name', 'description']);
  await seedTable(pool, 'albums', data.albums, [
    'id',
    'img_path',
    'name',
    'type',
    'artist_id',
    'like',
    'release_date',
    'uploaded_at',
    'available_at',
    'unavailable_at',
  ]);
  await seedTable(pool, 'songs', data.songs, [
    'id',
    'name',
    'artist_id',
    'album_id',
    'like',
    'audio_path',
    'img_path',
    'play_count',
    'length',
    'release_date',
    'uploaded_at',
    'available_at',
    'unavailable_at',
  ]);
  await seedTable(pool, 'playlists', data.playlists, ['id', 'name', 'user_id', 'type']);
  await seedTable(pool, 'playlist_users', data.playlistUsers, ['id', 'playlist_id', 'user_id']);
  await seedTable(pool, 'playlist_songs', data.playlistSongs, ['id', 'playlist_id', 'song_id']);
  await seedTable(pool, 'advertisements', data.advertisements, [
    'id',
    'title',
    'subtitle',
    'description',
    'placement',
    'image_path',
    'image_position_x',
    'image_position_y',
    'button_text',
    'link_type',
    'link_target',
    'enabled',
    'sort_order',
    'start_at',
    'end_at',
  ]);
  await seedTable(pool, 'home_recommendations', data.homeRecommendations, [
    'id',
    'popular_song_ids',
    'popular_artist_ids',
    'popular_album_ids',
  ]);
  await seedTable(pool, 'song_plays', data.songPlays, [
    'id',
    'song_id',
    'user_id',
    'played_at',
    'duration',
    'listened_seconds',
  ]);

  for (const table of [
    'users',
    'artists',
    'albums',
    'songs',
    'playlists',
    'playlist_users',
    'playlist_songs',
    'advertisements',
    'home_recommendations',
    'song_plays',
  ]) {
    await resetSequence(pool, table);
  }

  await pool.end();
  console.log('✅ 資料匯入完成');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
