import { inject, Injectable, signal } from '@angular/core';
import { ApiService, SongType } from './api.service';

@Injectable({ providedIn: 'root' })
export class MusicPlayerService {
  //////////////////////////////////////////////////////
  private api: ApiService = inject(ApiService);
  //////////////////////////////////////////////////////
  private currentSong = signal<SongType | null>(null);
  private isClose = signal<boolean>(false);
  //////////////////////////////////////////////////////

  setPlayer(songId: string) {
    localStorage.setItem('songId', songId);
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

  // localStorage.setItem('token', token);
}
