import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FirestoreDataService } from './firebase/firestore-data.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly data = inject(FirestoreDataService);

  getAllAlbum(): Observable<AlbumType[]> {
    return this.data.getAllAlbum();
  }

  getAllSong(): Observable<SongType[]> {
    return this.data.getAllSong();
  }

  getAllArtist(): Observable<ArtistType[]> {
    return this.data.getAllArtist();
  }

  getArtistByArtistId(id: string): Observable<ArtistType[]> {
    return this.data.getArtistByArtistId(id);
  }

  getAllUsers(): Observable<UserType[]> {
    return this.data.getAllUsers();
  }

  getHomeRecommendations(): Observable<HomeRecommendationType[]> {
    return this.data.getHomeRecommendations();
  }

  getAdvertisements(): Observable<AdvertisementType[]> {
    return this.data.getAdvertisements();
  }

  createAdvertisement(advertisement: CreateAdvertisementType): Observable<AdvertisementType> {
    return this.data.createAdvertisement(advertisement);
  }

  updateAdvertisement(
    id: number,
    advertisement: Partial<AdvertisementType>,
  ): Observable<AdvertisementType> {
    return this.data.updateAdvertisement(id, advertisement);
  }

  deleteAdvertisement(id: number): Observable<void> {
    return this.data.deleteAdvertisement(id);
  }

  createHomeRecommendations(
    recommendation: CreateHomeRecommendationType,
  ): Observable<HomeRecommendationType> {
    return this.data.createHomeRecommendations(recommendation);
  }

  updateHomeRecommendations(
    id: number,
    recommendation: Partial<HomeRecommendationType>,
  ): Observable<HomeRecommendationType> {
    return this.data.updateHomeRecommendations(id, recommendation);
  }

  createUser(user: CreateUserType): Observable<UserType> {
    return this.data.createUser(user);
  }

  updateUser(id: number, user: Partial<UserType>): Observable<UserType> {
    return this.data.updateUser(id, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.data.deleteUser(id);
  }

  getAllSongPlays(): Observable<SongPlayType[]> {
    return this.data.getAllSongPlays();
  }

  createSongPlay(play: CreateSongPlayType): Observable<SongPlayType> {
    return this.data.createSongPlay(play);
  }

  createArtist(name: string): Observable<ArtistType> {
    return this.data.createArtist(name);
  }

  updateArtist(id: number, artist: Partial<ArtistType>): Observable<ArtistType> {
    return this.data.updateArtist(id, artist);
  }

  createAlbum(
    name: string,
    artistId: number,
    imgPath: string,
    type: ReleaseType = 'album',
  ): Observable<AlbumType> {
    return this.data.createAlbum(name, artistId, imgPath, type);
  }

  updateAlbum(id: number, album: Partial<AlbumType>): Observable<AlbumType> {
    return this.data.updateAlbum(id, album);
  }

  getPlaylistByPlaylistId(id: string): Observable<AlbumType[]> {
    return this.data.getPlaylistByPlaylistId(id);
  }

  getAlbumByAlbumId(id: string): Observable<AlbumType[]> {
    return this.data.getAlbumByAlbumId(id);
  }

  getAllSongByAlbumId(id: string): Observable<SongType[]> {
    return this.data.getAllSongByAlbumId(id);
  }

  getAllAlbumByArtistId(id: string): Observable<AlbumType[]> {
    return this.data.getAllAlbumByArtistId(id);
  }

  getAllSongByArtistId(id: string): Observable<SongType[]> {
    return this.data.getAllSongByArtistId(id);
  }

  getSongById(id: string): Observable<SongType[]> {
    return this.data.getSongById(id);
  }

  getPlaylistUsersByUserId(id: string): Observable<PlaylistUsersType[]> {
    return this.data.getPlaylistUsersByUserId(id);
  }

  createPlaylist(name: string, userId: number, type = 'playlist'): Observable<PlaylistType> {
    return this.data.createPlaylist(name, userId, type);
  }

  createPlaylistUser(playlistId: number, userId: number): Observable<PlaylistUsersType> {
    return this.data.createPlaylistUser(playlistId, userId);
  }

  getAllSongByPlaylistId(id: string): Observable<PlaylistSongType[]> {
    return this.data.getAllSongByPlaylistId(id);
  }

  addSongToPlaylist(playlistId: number, songId: number): Observable<PlaylistSongType> {
    return this.data.addSongToPlaylist(playlistId, songId);
  }

  createSong(song: CreateSongType): Observable<SongType> {
    return this.data.createSong(song);
  }

  updateSong(id: number, song: Partial<CreateSongType>): Observable<SongType> {
    return this.data.updateSong(id, song);
  }

  deleteSong(id: number): Observable<void> {
    return this.data.deleteSong(id);
  }

  unpublishSong(id: number): Observable<SongType> {
    return this.data.unpublishSong(id);
  }

  republishSong(id: number): Observable<SongType> {
    return this.data.republishSong(id);
  }

  getSongDeleteBlockers(id: number): Observable<string[]> {
    return this.data.getSongDeleteBlockers(id);
  }

  deleteAlbum(id: number): Observable<void> {
    return this.data.deleteAlbum(id);
  }

  unpublishAlbum(id: number): Observable<AlbumType> {
    return this.data.unpublishAlbum(id);
  }

  republishAlbum(id: number): Observable<AlbumType> {
    return this.data.republishAlbum(id);
  }

  getAlbumDeleteBlockers(id: number): Observable<string[]> {
    return this.data.getAlbumDeleteBlockers(id);
  }

  deleteArtist(id: number): Observable<void> {
    return this.data.deleteArtist(id);
  }

  unpublishArtist(id: number): Observable<ArtistType> {
    return this.data.unpublishArtist(id);
  }

  republishArtist(id: number): Observable<ArtistType> {
    return this.data.republishArtist(id);
  }

  getArtistDeleteBlockers(id: number): Observable<string[]> {
    return this.data.getArtistDeleteBlockers(id);
  }

  uploadFile(fileName: string, dataUrl: string, fileType: string): Observable<UploadResponse> {
    return this.data.uploadFile(fileName, dataUrl, fileType);
  }

  deleteSongFromPlaylist(playlistSongId: number): Observable<void> {
    return this.data.deleteSongFromPlaylist(playlistSongId);
  }

  deletePlaylist(playlistId: number): Observable<void> {
    return this.data.deletePlaylist(playlistId);
  }

  deletePlaylistUser(playlistUserId: number): Observable<void> {
    return this.data.deletePlaylistUser(playlistUserId);
  }
}

export type CatalogStatus = 'published' | 'unpublished' | 'deleted';

export interface CreateSongType {
  name: string;
  artistId: number;
  albumId: number;
  like: number;
  audioPath: string;
  imgPath?: string;
  playCount?: number;
  releaseDate?: string;
  uploadedAt?: string;
  availableAt?: string;
  unavailableAt?: string;
  status?: CatalogStatus;
}

export interface CreateUserType {
  name: string;
  email: string;
  password: string;
  role: string;
  canAccessCms: boolean;
}

export interface CreateSongPlayType {
  songId: number;
  userId?: number | null;
  playedAt: string;
  duration: number;
  listenedSeconds: number;
}

export interface SongPlayType extends CreateSongPlayType {
  id: number;
}

export interface UploadResponse {
  path: string;
}

export interface SongType {
  id: number;
  playlistSongId?: number;
  imgPath?: string;
  artistId?: number;
  albumId?: number;
  name: string;
  album: AlbumType;
  artist: ArtistType;
  length: string;
  like: number;
  playCount?: number;
  audioPath: string;
  releaseDate?: string;
  uploadedAt?: string;
  availableAt?: string;
  unavailableAt?: string;
  status?: CatalogStatus;
}
export interface AlbumType {
  id: number;
  imgPath: string;
  type: ReleaseType | string;
  name: string;
  artistId?: number;
  engname?: string;
  artist?: ArtistType;
  user?: UserType;
  like?: number;
  releaseDate?: string;
  uploadedAt?: string;
  availableAt?: string;
  unavailableAt?: string;
  status?: CatalogStatus;
}

export type ReleaseType = 'album' | 'single' | 'ep' | 'ost';

export const releaseTypeOptions: { value: ReleaseType; label: string }[] = [
  { value: 'album', label: '專輯' },
  { value: 'single', label: '單曲' },
  { value: 'ep', label: 'EP' },
  { value: 'ost', label: '原聲帶' },
];

export function isReleaseType(type: string | null | undefined): type is ReleaseType {
  return ['album', 'single', 'ep', 'ost'].includes(type ?? '');
}

export function releaseTypeLabel(type: string | null | undefined): string {
  return releaseTypeOptions.find((option) => option.value === type)?.label ?? '發行作品';
}

export interface ArtistType {
  id: number;
  imgPath: string;
  name: string;
  description: string;
  status?: CatalogStatus;
}

export interface UserType {
  id: number;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
  canAccessCms?: boolean;
  authEmail?: string;
  authUid?: string;
}

export interface HomeRecommendationType {
  id: number;
  popularSongIds: number[];
  popularArtistIds: number[];
  popularAlbumIds?: number[];
}

export interface CreateHomeRecommendationType {
  popularSongIds: number[];
  popularArtistIds: number[];
  popularAlbumIds?: number[];
}

export type AdvertisementPlacement = 'homeHero' | 'homeSmall' | 'entryPopup';
export type AdvertisementLinkType = 'none' | 'song' | 'album' | 'artist' | 'url';

export interface CreateAdvertisementType {
  title: string;
  subtitle?: string;
  description?: string;
  placement: AdvertisementPlacement;
  imagePath: string;
  imagePositionX?: number;
  imagePositionY?: number;
  buttonText?: string;
  linkType: AdvertisementLinkType;
  linkTarget?: string;
  enabled: boolean;
  sortOrder: number;
  startAt?: string;
  endAt?: string;
}

export interface AdvertisementType extends CreateAdvertisementType {
  id: number;
}

export interface PlaylistUsersType {
  id: number;
  playlistId: number;
  playlist: PlaylistType;
  userId: number;
  user: UserType;
}

export interface PlaylistType {
  id: number;
  name: string;
  userId: number;
  type: string;
}

export interface PlaylistSongType {
  id: number;
  playlistId: number;
  songId: number;
  song: SongType;
}

export function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function toDateTimeInputValue(value: string | Date | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export function fromDateTimeInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString();
}

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) {
    return '未設定';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDisplayMonth(value: string | null | undefined): string {
  if (!value) {
    return '未設定發行月';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
  });
}

export function getCatalogStatus(
  item: { status?: CatalogStatus } | null | undefined,
): CatalogStatus {
  return item?.status ?? 'published';
}

export function isCatalogPublished(
  item: { status?: CatalogStatus } | null | undefined,
): boolean {
  return getCatalogStatus(item) === 'published';
}

export function catalogStatusLabel(status: CatalogStatus): string {
  switch (status) {
    case 'unpublished':
      return '已下架';
    case 'deleted':
      return '已刪除';
    default:
      return '已上架';
  }
}

export function isCatalogItemPlayable(item: {
  status?: CatalogStatus;
  availableAt?: string;
  unavailableAt?: string;
} | null | undefined): boolean {
  if (!item || !isCatalogPublished(item)) {
    return false;
  }

  const now = Date.now();
  const availableAt = item.availableAt ? new Date(item.availableAt).getTime() : 0;
  const unavailableAt = item.unavailableAt ? new Date(item.unavailableAt).getTime() : Number.POSITIVE_INFINITY;

  return availableAt <= now && now < unavailableAt;
}

export function isSongPlayable(song: SongType | null | undefined): boolean {
  return (
    !!song &&
    isCatalogItemPlayable(song) &&
    isCatalogItemPlayable(song.album) &&
    isCatalogItemPlayable(song.artist)
  );
}

export function availabilityMessage(song: SongType | AlbumType | null | undefined): string {
  if (!song) {
    return '找不到這筆資料';
  }

  const status = getCatalogStatus(song);
  if (status === 'deleted') {
    return '已刪除';
  }
  if (status === 'unpublished') {
    return '已下架';
  }

  const now = Date.now();
  const availableAt = song.availableAt ? new Date(song.availableAt).getTime() : 0;
  const unavailableAt = song.unavailableAt ? new Date(song.unavailableAt).getTime() : Number.POSITIVE_INFINITY;

  if (availableAt > now) {
    return `尚未上架，預計 ${formatDisplayDate(song.availableAt)} 開放`;
  }

  if (unavailableAt <= now) {
    return '已下架';
  }

  return '已上架';
}
