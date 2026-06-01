import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { from, map, Observable } from 'rxjs';
import {
  AdvertisementType,
  AlbumType,
  ArtistType,
  CreateAdvertisementType,
  CreateHomeRecommendationType,
  CreateSongPlayType,
  CreateSongType,
  CreateUserType,
  HomeRecommendationType,
  PlaylistSongType,
  PlaylistType,
  PlaylistUsersType,
  ReleaseType,
  SongPlayType,
  SongType,
  UploadResponse,
  UserType,
} from '../api.service';
import { getFirebaseFirestore, getFirebaseStorage } from './firebase.app';

const COL = {
  users: 'users',
  artists: 'artists',
  albums: 'albums',
  songs: 'songs',
  playlists: 'playlists',
  playlistUsers: 'playlistUsers',
  playlistSongs: 'playlistSongs',
  advertisements: 'advertisements',
  homeRecommendations: 'homeRecommendations',
  songPlays: 'songPlays',
} as const;

@Injectable({ providedIn: 'root' })
export class FirestoreDataService {
  private readonly db = getFirebaseFirestore();
  private readonly storage = getFirebaseStorage();

  getAllAlbum(): Observable<AlbumType[]> {
    return from(this.loadAlbumsExpanded());
  }

  getAllSong(): Observable<SongType[]> {
    return from(this.loadSongsExpanded());
  }

  getAllArtist(): Observable<ArtistType[]> {
    return from(this.getCollection<ArtistType>(COL.artists));
  }

  getArtistByArtistId(id: string): Observable<ArtistType[]> {
    return from(this.getCollection<ArtistType>(COL.artists, { id: Number(id) }));
  }

  getAllUsers(): Observable<UserType[]> {
    return from(this.getCollection<UserType>(COL.users));
  }

  getHomeRecommendations(): Observable<HomeRecommendationType[]> {
    return from(this.getCollection<HomeRecommendationType>(COL.homeRecommendations));
  }

  getAdvertisements(): Observable<AdvertisementType[]> {
    return from(this.getCollection<AdvertisementType>(COL.advertisements));
  }

  createAdvertisement(advertisement: CreateAdvertisementType): Observable<AdvertisementType> {
    return from(this.create<AdvertisementType>(COL.advertisements, advertisement as DocumentData));
  }

  updateAdvertisement(
    id: number,
    advertisement: Partial<AdvertisementType>,
  ): Observable<AdvertisementType> {
    return from(this.patch<AdvertisementType>(COL.advertisements, id, advertisement as DocumentData));
  }

  deleteAdvertisement(id: number): Observable<void> {
    return from(this.remove(COL.advertisements, id));
  }

  createHomeRecommendations(
    recommendation: CreateHomeRecommendationType,
  ): Observable<HomeRecommendationType> {
    return from(
      this.create<HomeRecommendationType>(COL.homeRecommendations, recommendation as DocumentData),
    );
  }

  updateHomeRecommendations(
    id: number,
    recommendation: Partial<HomeRecommendationType>,
  ): Observable<HomeRecommendationType> {
    return from(
      this.patch<HomeRecommendationType>(COL.homeRecommendations, id, recommendation as DocumentData),
    );
  }

  createUser(user: CreateUserType): Observable<UserType> {
    return from(this.create<UserType>(COL.users, { ...user, password: '' } as DocumentData));
  }

  updateUser(id: number, user: Partial<UserType>): Observable<UserType> {
    const { password: _password, ...rest } = user;
    return from(this.patch<UserType>(COL.users, id, rest as DocumentData));
  }

  deleteUser(id: number): Observable<void> {
    return from(this.remove(COL.users, id));
  }

  getAllSongPlays(): Observable<SongPlayType[]> {
    return from(this.getCollection<SongPlayType>(COL.songPlays));
  }

  createSongPlay(play: CreateSongPlayType): Observable<SongPlayType> {
    return from(this.createSongPlayRecord(play));
  }

  createArtist(name: string): Observable<ArtistType> {
    return from(
      this.create<ArtistType>(COL.artists, {
        name,
        imgPath: './mock/unnamed.png',
        description: '',
      }),
    );
  }

  updateArtist(id: number, artist: Partial<ArtistType>): Observable<ArtistType> {
    return from(this.patch<ArtistType>(COL.artists, id, artist as DocumentData));
  }

  createAlbum(
    name: string,
    artistId: number,
    imgPath: string,
    type: ReleaseType = 'album',
  ): Observable<AlbumType> {
    const today = new Date().toISOString().slice(0, 10);
    return from(
      this.create<AlbumType>(COL.albums, {
        name,
        type,
        artistId,
        imgPath,
        like: 0,
        releaseDate: today,
        uploadedAt: new Date().toISOString(),
        availableAt: new Date().toISOString(),
      }),
    );
  }

  updateAlbum(id: number, album: Partial<AlbumType>): Observable<AlbumType> {
    return from(this.patch<AlbumType>(COL.albums, id, album as DocumentData));
  }

  getPlaylistByPlaylistId(id: string): Observable<AlbumType[]> {
    return from(this.getPlaylistsWithUser({ id: Number(id) }));
  }

  getAlbumByAlbumId(id: string): Observable<AlbumType[]> {
    return from(this.loadAlbumsExpanded({ id: Number(id) }));
  }

  getAllSongByAlbumId(id: string): Observable<SongType[]> {
    return from(this.loadSongsExpanded({ albumId: Number(id) }));
  }

  getAllAlbumByArtistId(id: string): Observable<AlbumType[]> {
    return from(this.loadAlbumsExpanded({ artistId: Number(id) }));
  }

  getAllSongByArtistId(id: string): Observable<SongType[]> {
    return from(this.loadSongsExpanded({ artistId: Number(id) }));
  }

  getSongById(id: string): Observable<SongType[]> {
    return from(this.loadSongsExpanded({ id: Number(id) }));
  }

  getPlaylistUsersByUserId(id: string): Observable<PlaylistUsersType[]> {
    return from(this.loadPlaylistUsersExpanded({ userId: Number(id) }));
  }

  createPlaylist(name: string, userId: number, type = 'playlist'): Observable<PlaylistType> {
    return from(this.create<PlaylistType>(COL.playlists, { name, userId, type }));
  }

  createPlaylistUser(playlistId: number, userId: number): Observable<PlaylistUsersType> {
    return from(this.create<PlaylistUsersType>(COL.playlistUsers, { playlistId, userId }));
  }

  getAllSongByPlaylistId(id: string): Observable<PlaylistSongType[]> {
    return from(this.loadPlaylistSongsExpanded({ playlistId: Number(id) }));
  }

  addSongToPlaylist(playlistId: number, songId: number): Observable<PlaylistSongType> {
    return from(this.create<PlaylistSongType>(COL.playlistSongs, { playlistId, songId }));
  }

  createSong(song: CreateSongType): Observable<SongType> {
    return from(this.createSongRecord(song));
  }

  updateSong(id: number, song: Partial<CreateSongType>): Observable<SongType> {
    return from(this.patchSong(id, song));
  }

  deleteSong(id: number): Observable<void> {
    return from(this.deleteSongRecord(id));
  }

  unpublishSong(id: number): Observable<SongType> {
    return from(this.unpublishSongRecord(id));
  }

  republishSong(id: number): Observable<SongType> {
    return from(this.republishSongRecord(id));
  }

  getSongDeleteBlockers(id: number): Observable<string[]> {
    return from(this.collectSongDeleteBlockers(id));
  }

  deleteAlbum(id: number): Observable<void> {
    return from(this.deleteAlbumRecord(id));
  }

  unpublishAlbum(id: number): Observable<AlbumType> {
    return from(this.unpublishAlbumRecord(id));
  }

  republishAlbum(id: number): Observable<AlbumType> {
    return from(this.republishAlbumRecord(id));
  }

  getAlbumDeleteBlockers(id: number): Observable<string[]> {
    return from(this.collectAlbumDeleteBlockers(id));
  }

  deleteArtist(id: number): Observable<void> {
    return from(this.deleteArtistRecord(id));
  }

  unpublishArtist(id: number): Observable<ArtistType> {
    return from(this.unpublishArtistRecord(id));
  }

  republishArtist(id: number): Observable<ArtistType> {
    return from(this.republishArtistRecord(id));
  }

  getArtistDeleteBlockers(id: number): Observable<string[]> {
    return from(this.collectArtistDeleteBlockers(id));
  }

  uploadFile(fileName: string, dataUrl: string, fileType: string): Observable<UploadResponse> {
    return from(this.uploadToStorage(fileName, dataUrl, fileType));
  }

  deleteSongFromPlaylist(playlistSongId: number): Observable<void> {
    return from(this.remove(COL.playlistSongs, playlistSongId));
  }

  deletePlaylist(playlistId: number): Observable<void> {
    return from(this.remove(COL.playlists, playlistId));
  }

  deletePlaylistUser(playlistUserId: number): Observable<void> {
    return from(this.remove(COL.playlistUsers, playlistUserId));
  }

  findUsersByEmail(email: string): Observable<UserType[]> {
    return from(this.getCollection<UserType>(COL.users, { email }));
  }

  findUsersByPhone(phone: string): Observable<UserType[]> {
    return from(this.getCollection<UserType>(COL.users, { phone }));
  }

  findUserByAuthEmail(authEmail: string): Observable<UserType | null> {
    return from(
      this.getCollection<UserType>(COL.users, { authEmail }).then((rows) => rows[0] ?? null),
    );
  }

  // --- internal ---

  private async getCollection<T extends { id: number }>(
    name: string,
    filters?: Record<string, string | number>,
  ): Promise<T[]> {
    const col = collection(this.db, name);
    const q = filters
      ? query(
          col,
          ...Object.entries(filters).map(([key, value]) => where(key, '==', value)),
        )
      : col;
    const snap = await getDocs(q);
    return snap.docs.map((d) => this.fromDoc<T>(d.id, d.data()));
  }

  private fromDoc<T extends { id: number }>(docId: string, data: DocumentData): T {
    const numericId = Number(data['id'] ?? docId);
    const { password: _password, ...rest } = data;
    return { id: numericId, ...rest, password: '' } as unknown as T;
  }

  private async nextId(name: string): Promise<number> {
    const rows = await this.getCollection<{ id: number }>(name);
    return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  }

  private async create<T extends { id: number }>(
    name: string,
    body: DocumentData,
  ): Promise<T> {
    const id = await this.nextId(name);
    const payload = { ...body, id };
    await setDoc(doc(this.db, name, String(id)), payload);
    return payload as unknown as T;
  }

  private async patch<T extends { id: number }>(
    name: string,
    id: number,
    body: DocumentData,
  ): Promise<T> {
    const ref = doc(this.db, name, String(id));
    await updateDoc(ref, body as DocumentData);
    const snap = await getDoc(ref);
    return this.fromDoc<T>(snap.id, snap.data() ?? { id });
  }

  private async remove(name: string, id: number): Promise<void> {
    await deleteDoc(doc(this.db, name, String(id)));
  }

  private nowIso(): string {
    return new Date().toISOString();
  }

  private async unpublishSongRecord(id: number): Promise<SongType> {
    await this.patch(COL.songs, id, { status: 'unpublished', unavailableAt: this.nowIso() });
    const [expanded] = await this.loadSongsExpanded({ id });
    if (!expanded) throw new Error('找不到歌曲');
    return expanded;
  }

  private async republishSongRecord(id: number): Promise<SongType> {
    const now = this.nowIso();
    await this.patch(COL.songs, id, { status: 'published', unavailableAt: '', availableAt: now });
    const [expanded] = await this.loadSongsExpanded({ id });
    if (!expanded) throw new Error('找不到歌曲');
    return expanded;
  }

  private async unpublishAlbumRecord(id: number): Promise<AlbumType> {
    await this.patch(COL.albums, id, { status: 'unpublished', unavailableAt: this.nowIso() });
    const [expanded] = await this.loadAlbumsExpanded({ id });
    if (!expanded) throw new Error('找不到發行作品');
    return expanded;
  }

  private async republishAlbumRecord(id: number): Promise<AlbumType> {
    const now = this.nowIso();
    await this.patch(COL.albums, id, { status: 'published', unavailableAt: '', availableAt: now });
    const [expanded] = await this.loadAlbumsExpanded({ id });
    if (!expanded) throw new Error('找不到發行作品');
    return expanded;
  }

  private async unpublishArtistRecord(id: number): Promise<ArtistType> {
    await this.patch(COL.artists, id, { status: 'unpublished', unavailableAt: this.nowIso() });
    const [artist] = await this.getCollection<ArtistType>(COL.artists, { id });
    if (!artist) throw new Error('找不到藝人');
    return artist;
  }

  private async republishArtistRecord(id: number): Promise<ArtistType> {
    const now = this.nowIso();
    await this.patch(COL.artists, id, { status: 'published', unavailableAt: '', availableAt: now });
    const [artist] = await this.getCollection<ArtistType>(COL.artists, { id });
    if (!artist) throw new Error('找不到藝人');
    return artist;
  }

  private async collectSongDeleteBlockers(songId: number): Promise<string[]> {
    const blockers: string[] = [];
    const [playlistSongs, homeRecs, ads] = await Promise.all([
      this.getCollection<PlaylistSongType>(COL.playlistSongs, { songId }),
      this.getCollection<HomeRecommendationType>(COL.homeRecommendations),
      this.getCollection<AdvertisementType>(COL.advertisements),
    ]);

    if (playlistSongs.length) {
      blockers.push(`仍被 ${playlistSongs.length} 個歌單引用，請先從歌單移除`);
    }
    if (homeRecs.some((row) => row.popularSongIds?.includes(songId))) {
      blockers.push('仍出現在首頁推薦，請先到首頁推薦移除');
    }
    if (ads.some((ad) => ad.linkType === 'song' && ad.linkTarget === String(songId))) {
      blockers.push('仍有廣告連結至這首歌，請先調整廣告設定');
    }
    return blockers;
  }

  private async collectAlbumDeleteBlockers(albumId: number): Promise<string[]> {
    const blockers: string[] = [];
    const [songs, homeRecs, ads] = await Promise.all([
      this.getCollection<SongType>(COL.songs, { albumId }),
      this.getCollection<HomeRecommendationType>(COL.homeRecommendations),
      this.getCollection<AdvertisementType>(COL.advertisements),
    ]);

    if (songs.length) {
      blockers.push(`仍有 ${songs.length} 首歌曲掛在這張作品下，請先移出或刪除歌曲`);
    }
    if (homeRecs.some((row) => row.popularAlbumIds?.includes(albumId))) {
      blockers.push('仍出現在首頁推薦，請先到首頁推薦移除');
    }
    if (ads.some((ad) => ad.linkType === 'album' && ad.linkTarget === String(albumId))) {
      blockers.push('仍有廣告連結至此作品，請先調整廣告設定');
    }
    return blockers;
  }

  private async collectArtistDeleteBlockers(artistId: number): Promise<string[]> {
    const blockers: string[] = [];
    const [albums, songs, homeRecs, ads] = await Promise.all([
      this.getCollection<AlbumType>(COL.albums, { artistId }),
      this.getCollection<SongType>(COL.songs, { artistId }),
      this.getCollection<HomeRecommendationType>(COL.homeRecommendations),
      this.getCollection<AdvertisementType>(COL.advertisements),
    ]);

    const releaseAlbums = albums.filter((album) => album.type !== 'playlist');
    if (releaseAlbums.length) {
      blockers.push(`仍有 ${releaseAlbums.length} 張發行作品，請先處理相關作品`);
    }
    if (songs.length) {
      blockers.push(`仍有 ${songs.length} 首歌曲，請先移出或刪除歌曲`);
    }
    if (homeRecs.some((row) => row.popularArtistIds?.includes(artistId))) {
      blockers.push('仍出現在首頁推薦，請先到首頁推薦移除');
    }
    if (ads.some((ad) => ad.linkType === 'artist' && ad.linkTarget === String(artistId))) {
      blockers.push('仍有廣告連結至此藝人，請先調整廣告設定');
    }
    return blockers;
  }

  private async deleteSongRecord(id: number): Promise<void> {
    const blockers = await this.collectSongDeleteBlockers(id);
    if (blockers.length) {
      throw new Error(blockers.join('；'));
    }
    await this.remove(COL.songs, id);
  }

  private async deleteAlbumRecord(id: number): Promise<void> {
    const blockers = await this.collectAlbumDeleteBlockers(id);
    if (blockers.length) {
      throw new Error(blockers.join('；'));
    }
    await this.remove(COL.albums, id);
  }

  private async deleteArtistRecord(id: number): Promise<void> {
    const blockers = await this.collectArtistDeleteBlockers(id);
    if (blockers.length) {
      throw new Error(blockers.join('；'));
    }
    await this.remove(COL.artists, id);
  }

  private async loadArtistsMap(): Promise<Map<number, ArtistType>> {
    const artists = await this.getCollection<ArtistType>(COL.artists);
    return new Map(artists.map((a) => [a.id, a]));
  }

  private async loadAlbumsMap(): Promise<Map<number, AlbumType>> {
    const albums = await this.getCollection<AlbumType>(COL.albums);
    return new Map(albums.map((a) => [a.id, a]));
  }

  private async loadAlbumsExpanded(
    filters?: Record<string, number>,
  ): Promise<AlbumType[]> {
    const [albums, artists] = await Promise.all([
      this.getCollection<AlbumType>(COL.albums, filters),
      this.loadArtistsMap(),
    ]);
    return albums.map((album) => ({
      ...album,
      artist: album.artistId ? artists.get(album.artistId) : undefined,
    }));
  }

  private async loadSongsExpanded(
    filters?: Record<string, number>,
  ): Promise<SongType[]> {
    const [songs, albums, artists] = await Promise.all([
      this.getCollection<SongType>(COL.songs, filters),
      this.loadAlbumsMap(),
      this.loadArtistsMap(),
    ]);
    return songs.map((song) => {
      const album = song.albumId ? albums.get(song.albumId) : undefined;
      const artist = song.artistId ? artists.get(song.artistId) : undefined;
      return {
        ...song,
        album: album
          ? { ...album, artist: album.artistId ? artists.get(album.artistId) : undefined }
          : ({} as AlbumType),
        artist: artist ?? ({} as ArtistType),
      };
    });
  }

  private async createSongRecord(song: CreateSongType): Promise<SongType> {
    const created = await this.create<SongType>(COL.songs, song as unknown as DocumentData);
    const [expanded] = await this.loadSongsExpanded({ id: created.id });
    return expanded ?? created;
  }

  private async patchSong(id: number, song: Partial<CreateSongType>): Promise<SongType> {
    await this.patch(COL.songs, id, song as DocumentData);
    const [expanded] = await this.loadSongsExpanded({ id });
    return expanded;
  }

  private async createSongPlayRecord(play: CreateSongPlayType): Promise<SongPlayType> {
    const created = await this.create<SongPlayType>(COL.songPlays, play as unknown as DocumentData);
    const songRef = doc(this.db, COL.songs, String(play.songId));
    const songSnap = await getDoc(songRef);
    if (songSnap.exists()) {
      const current = Number(songSnap.data()['playCount'] ?? 0);
      await updateDoc(songRef, { playCount: current + 1 });
    }
    return created;
  }

  private async loadPlaylistUsersExpanded(
    filters: Record<string, number>,
  ): Promise<PlaylistUsersType[]> {
    const [rows, users, playlists] = await Promise.all([
      this.getCollection<PlaylistUsersType>(COL.playlistUsers, filters),
      this.getCollection<UserType>(COL.users),
      this.getCollection<PlaylistType>(COL.playlists),
    ]);
    const userMap = new Map(users.map((u) => [u.id, u]));
    const playlistMap = new Map(playlists.map((p) => [p.id, p]));
    return rows.map((row) => ({
      ...row,
      user: userMap.get(row.userId) ?? ({} as UserType),
      playlist: playlistMap.get(row.playlistId) ?? ({} as PlaylistType),
    }));
  }

  private async loadPlaylistSongsExpanded(
    filters: Record<string, number>,
  ): Promise<PlaylistSongType[]> {
    const rows = await this.getCollection<PlaylistSongType>(COL.playlistSongs, filters);
    const songs = await this.loadSongsExpanded();
    const songMap = new Map(songs.map((s) => [s.id, s]));
    return rows.map((row) => ({
      ...row,
      song: songMap.get(row.songId) ?? ({} as SongType),
    }));
  }

  private async getPlaylistsWithUser(
    filters: Record<string, number>,
  ): Promise<AlbumType[]> {
    const playlists = await this.getCollection<PlaylistType>(COL.playlists, filters);
    const users = await this.getCollection<UserType>(COL.users);
    const userMap = new Map(users.map((u) => [u.id, u]));
    return playlists.map((p) => ({
      id: p.id,
      name: p.name,
      imgPath: '',
      type: p.type,
      user: userMap.get(p.userId),
    })) as unknown as AlbumType[];
  }

  private async uploadToStorage(
    fileName: string,
    dataUrl: string,
    fileType: string,
  ): Promise<UploadResponse> {
    const folder = fileType.startsWith('audio/') ? 'audio' : 'upload';
    const safeName = `${folder}/${Date.now()}-${fileName.replace(/[^\w.\-]+/g, '_')}`;
    const storageRef = ref(this.storage, safeName);
    await uploadString(storageRef, dataUrl, 'data_url', { contentType: fileType });
    const path = await getDownloadURL(storageRef);
    return { path };
  }
}
