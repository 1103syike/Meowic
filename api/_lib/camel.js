const COLUMN_MAP = {
  users: {
    canAccessCms: 'can_access_cms',
  },
  artists: {
    imgPath: 'img_path',
  },
  albums: {
    imgPath: 'img_path',
    artistId: 'artist_id',
    releaseDate: 'release_date',
    uploadedAt: 'uploaded_at',
    availableAt: 'available_at',
    unavailableAt: 'unavailable_at',
  },
  songs: {
    artistId: 'artist_id',
    albumId: 'album_id',
    audioPath: 'audio_path',
    imgPath: 'img_path',
    playCount: 'play_count',
    releaseDate: 'release_date',
    uploadedAt: 'uploaded_at',
    availableAt: 'available_at',
    unavailableAt: 'unavailable_at',
  },
  playlists: {
    userId: 'user_id',
  },
  playlistUsers: {
    playlistId: 'playlist_id',
    userId: 'user_id',
  },
  playlistSongs: {
    playlistId: 'playlist_id',
    songId: 'song_id',
  },
  advertisements: {
    imagePath: 'image_path',
    imagePositionX: 'image_position_x',
    imagePositionY: 'image_position_y',
    buttonText: 'button_text',
    linkType: 'link_type',
    linkTarget: 'link_target',
    sortOrder: 'sort_order',
    startAt: 'start_at',
    endAt: 'end_at',
  },
  homeRecommendations: {
    popularSongIds: 'popular_song_ids',
    popularArtistIds: 'popular_artist_ids',
    popularAlbumIds: 'popular_album_ids',
  },
  songPlays: {
    songId: 'song_id',
    userId: 'user_id',
    playedAt: 'played_at',
    listenedSeconds: 'listened_seconds',
  },
};

const TABLE_NAMES = {
  users: 'users',
  artists: 'artists',
  albums: 'albums',
  songs: 'songs',
  playlists: 'playlists',
  playlistUsers: 'playlist_users',
  playlistSongs: 'playlist_songs',
  advertisements: 'advertisements',
  homeRecommendations: 'home_recommendations',
  songPlays: 'song_plays',
};

function snakeToCamel(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function rowToCamel(row, resource) {
  if (!row) return row;
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    let camelKey = snakeToCamel(key);
    if (resource === 'homeRecommendations') {
      if (key === 'popular_song_ids') camelKey = 'popularSongIds';
      if (key === 'popular_artist_ids') camelKey = 'popularArtistIds';
      if (key === 'popular_album_ids') camelKey = 'popularAlbumIds';
    }
    out[camelKey] = value;
  }
  return out;
}

function bodyToColumns(resource, body) {
  const map = COLUMN_MAP[resource] || {};
  const columns = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === 'id') continue;
    const col = map[key] || key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    columns[col] = value;
  }
  return columns;
}

module.exports = {
  COLUMN_MAP,
  TABLE_NAMES,
  rowToCamel,
  bodyToColumns,
};
