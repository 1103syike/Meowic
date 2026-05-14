import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MusicPlayerService } from '../../@service/music-player.service';
import { SongType } from '../../@service/api.service';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, interval, Subscription, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimePipe } from '../../@pipe/time-pipe';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-player',
  imports: [MatIcon, MatSliderModule, RouterLink],
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
  public musicPlayer = new Audio('/audio/Test.mp3');
  public currentTime = 0;
  /////////////////////////////////////////////

  constructor() {
    this.subscribeRouter();
  }

  ngOnInit() {
    this.setSongByLocalStorage();
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
      console.log(this.currentSong());

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
