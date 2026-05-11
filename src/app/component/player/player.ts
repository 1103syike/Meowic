import { Component, DestroyRef, inject, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MusicPlayerService } from '../../@service/music-player.service';
import { SongType } from '../../@service/api.service';
import { NavigationEnd, Router } from '@angular/router';
import { filter, interval, Subscription, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimePipe } from '../../@pipe/time-pipe';

@Component({
  selector: 'app-player',
  imports: [MatIcon],
  templateUrl: './player.html',
  styleUrl: './player.scss',
  providers: [TimePipe],
})
export class Player {
  /////////////////////////////////////////////
  private player: MusicPlayerService = inject(MusicPlayerService);
  private readonly timePipe: TimePipe = inject(TimePipe);
  private destroyRef = inject(DestroyRef); // 注入銷毀引用
  private router: Router = inject(Router);
  public status = signal<string>('play');
  public playedTime = signal<string>('0:00');
  /////////////////////////////////////////////
  public isClose = signal<boolean>(false);
  public currentSongId = signal<string | null>(null);
  public currentSong = signal<SongType | null>(null);
  private timerSub?: Subscription; // 用來存放計時器訂閱
  /////////////////////////////////////////////

  constructor() {
    this.subscribeRouter();
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

  ngOnInit() {
    this.setSongByLocalStorage();
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

  ///////////////////////////////////////////////////
  private readonly TICK_MS = 100;
  private currentMs = 0;
  public currentTimePer = signal<number>(0);

  public playMusic() {
    this.timerSub?.unsubscribe();

    if (this.status() === 'play') {
      this.status.set('pause');

      const totalMs = (this.timePipe.transform(this.currentSong()!.length) as number) * 1000;

      this.timerSub = interval(this.TICK_MS)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.currentMs += this.TICK_MS;

          const currentSecond = Math.floor(this.currentMs / 1000);
          this.playedTime.set(this.timePipe.transform(currentSecond) as string);
          this.currentTimePer.set((this.currentMs / totalMs) * 100)
          console.log(this.currentTimePer());

          if (this.currentMs >= totalMs) {
            this.stopMusic();
          }
        });
    } else {
      this.status.set('play');
    }
  }

  private stopMusic() {
    this.timerSub?.unsubscribe();

    this.status.set('play');
    this.currentMs = 0;

    this.playedTime.set(this.timePipe.transform(0) as string);

    console.log('音樂播放結束或手動停止');
  }

  public musicPlayer = new Audio('/audio/Test.mp3');

  ///////////////////////////////////////////////
}
