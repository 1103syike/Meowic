import { inject, Injectable, signal } from '@angular/core';
import { ApiService, SongType } from './api.service';
import { PlaybackQueueService } from './playback-queue.service';

@Injectable({ providedIn: 'root' })
export class MusicPlayerService {
  //////////////////////////////////////////////////////
  private api: ApiService = inject(ApiService);
  private playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  //////////////////////////////////////////////////////
  private currentSong = signal<SongType | null>(null);
  private isClose = signal<boolean>(false);
  private isPlaying = signal<boolean>(false);
  //////////////////////////////////////////////////////

  setPlayer(songId: string) {
    localStorage.setItem('songId', songId);
    this.playbackQueue.setCurrentSong(Number(songId));
  }

  getPlayer(songId: string) {
    return this.api.getSongById(songId);
  }

  setIsClose(isClose: boolean) {
    return this.isClose.set(isClose);
  }

  getIsClose() {
    return this.isClose();
  }

  setIsPlaying(isPlaying: boolean): void {
    this.isPlaying.set(isPlaying);
  }

  getIsPlaying(): boolean {
    return this.isPlaying();
  }

  // localStorage.setItem('token', token);
}
