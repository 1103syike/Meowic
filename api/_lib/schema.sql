-- Meowic PostgreSQL schema (Neon / Supabase / Vercel Postgres compatible)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  can_access_cms BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS artists (
  id SERIAL PRIMARY KEY,
  img_path TEXT NOT NULL DEFAULT './mock/unnamed.png',
  name TEXT NOT NULL,
  description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS albums (
  id SERIAL PRIMARY KEY,
  img_path TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'album',
  artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
  like INTEGER DEFAULT 0,
  release_date TEXT,
  uploaded_at TIMESTAMPTZ,
  available_at TIMESTAMPTZ,
  unavailable_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS songs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
  album_id INTEGER REFERENCES albums(id) ON DELETE SET NULL,
  like INTEGER DEFAULT 0,
  audio_path TEXT NOT NULL,
  img_path TEXT,
  play_count INTEGER DEFAULT 0,
  length TEXT,
  release_date TEXT,
  uploaded_at TIMESTAMPTZ,
  available_at TIMESTAMPTZ,
  unavailable_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS playlists (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'playlist'
);

CREATE TABLE IF NOT EXISTS playlist_users (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlist_songs (
  id SERIAL PRIMARY KEY,
  playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS advertisements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  placement TEXT NOT NULL,
  image_path TEXT NOT NULL,
  image_position_x DOUBLE PRECISION,
  image_position_y DOUBLE PRECISION,
  button_text TEXT,
  link_type TEXT NOT NULL DEFAULT 'none',
  link_target TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS home_recommendations (
  id SERIAL PRIMARY KEY,
  popular_song_ids JSONB NOT NULL DEFAULT '[]',
  popular_artist_ids JSONB NOT NULL DEFAULT '[]',
  popular_album_ids JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS song_plays (
  id SERIAL PRIMARY KEY,
  song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER DEFAULT 0,
  listened_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);
