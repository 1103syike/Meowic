import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, PlaylistType } from './api.service';

@Injectable({ providedIn: 'root' })
export class FavoritePlaylistService {
  private api: ApiService = inject(ApiService);
  private favoritePlaylistRequests = new Map<number, Promise<PlaylistType>>();

  public async ensureFavoritePlaylist(userId: number): Promise<PlaylistType> {
    const currentRequest = this.favoritePlaylistRequests.get(userId);
    if (currentRequest) {
      return currentRequest;
    }

    const request = this.loadOrCreateFavoritePlaylist(userId);
    this.favoritePlaylistRequests.set(userId, request);

    try {
      return await request;
    } finally {
      this.favoritePlaylistRequests.delete(userId);
    }
  }

  private async loadOrCreateFavoritePlaylist(userId: number): Promise<PlaylistType> {
    const playlistUsers = await firstValueFrom(this.api.getPlaylistUsersByUserId(userId.toString()));
    const favorite = playlistUsers
      .map((item) => item.playlist)
      .filter((playlist) => playlist.type === 'favorite')
      .sort((a, b) => a.id - b.id)[0];

    if (favorite) {
      return favorite;
    }

    const playlist = await firstValueFrom(
      this.api.createPlaylist('我喜歡的歌曲', userId, 'favorite'),
    );
    await firstValueFrom(this.api.createPlaylistUser(playlist.id, userId));
    return playlist;
  }

  public async getFavoriteSongIds(userId: number): Promise<Set<number>> {
    const playlist = await this.ensureFavoritePlaylist(userId);
    const songs = await firstValueFrom(this.api.getAllSongByPlaylistId(playlist.id.toString()));
    return new Set(songs.map((song) => song.songId));
  }

  public async addSongToFavorite(userId: number, songId: number): Promise<void> {
    const playlist = await this.ensureFavoritePlaylist(userId);
    const songs = await firstValueFrom(this.api.getAllSongByPlaylistId(playlist.id.toString()));

    if (songs.some((song) => song.songId === songId)) {
      return;
    }

    await firstValueFrom(this.api.addSongToPlaylist(playlist.id, songId));
  }
}
