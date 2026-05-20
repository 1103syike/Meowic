import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MusicPlayerService } from '../../@service/music-player.service';
import { SongType } from '../../@service/api.service';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, interval, Subscription, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimePipe } from '../../@pipe/time-pipe';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-player',
  imports: [MatIcon, MatSliderModule, RouterLink, FormsModule],
  templateUrl: './player.html',
  styleUrl: './player.scss',
  providers: [TimePipe],
})
export class Player {
  /////////////////////////////////////////////
  private player: MusicPlayerService = inject(MusicPlayerService);
  private router: Router = inject(Router);
  /////////////////////////////////////////////
  public isClose = signal<boolean>(false);
  public currentSongId = signal<string | null>(null);
  public currentSong = signal<SongType | null>(null);
  public musicPlayer = new Audio('');
  public currentTime = 0;
  public currentVolume = 0;
  value = 0;
  showTicks = false;
  duration = signal<number>(0);
  /////////////////////////////////////////////

  constructor() {
    this.subscribeRouter();
  }

  ngOnInit() {
    this.setSongByLocalStorage();
  }

  onVolumeInput(volume: number) {
    this.currentVolume = volume;
  }

  onLoadedMetadata(player: HTMLAudioElement) {
    if (Number.isFinite(player.duration)) {
      this.duration.set(player.duration);
    }
  }
  
  private subscribeRouter() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const nextSongId = localStorage.getItem('songId');
        if (nextSongId !== this.currentSongId()) {
          this.setSongByLocalStorage();
        }
      });
  }

  private setSongByLocalStorage() {
    this.currentSongId.set(localStorage.getItem('songId')!);
    this.player.getPlayer(this.currentSongId()!).subscribe((res) => {
      this.currentSong.set(res[0]);
    });
  }

  closePlayer(boolean: boolean) {
    this.player.setIsClose(boolean);
  }

  // 轉換秒數方法
  formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  ///////////////////////////////////////////////
}
