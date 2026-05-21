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
import { PlaybackQueueService } from '../../@service/playback-queue.service';

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
  public playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  /////////////////////////////////////////////
  public isClose = signal<boolean>(false);
  public currentSongId = signal<string | null>(null);
  public currentSong = signal<SongType | null>(null);
  public musicPlayer = new Audio('');
  public currentTime = 0;
  public currentVolume = 0;
  public isQueueOpen = signal(false);
  public isMuted = signal(false);
  private readonly volumeStorageKey = 'playerVolume';
  private readonly mutedStorageKey = 'playerMuted';
  private readonly previousVolumeStorageKey = 'playerPreviousVolume';
  private previousVolume = 70;
  value = this.getStoredVolume();
  showTicks = false;
  duration = signal<number>(0);
  /////////////////////////////////////////////

  constructor() {
    this.subscribeRouter();
  }

  ngOnInit() {
    this.restoreMutedState();
    this.setSongByLocalStorage();
  }

  onVolumeInput(volume: number) {
    this.setVolume(volume);
  }

  public setVolume(volume: number): void {
    const nextVolume = Math.max(0, Math.min(100, volume));
    this.value = nextVolume;
    this.currentVolume = nextVolume;
    localStorage.setItem(this.volumeStorageKey, nextVolume.toString());

    if (nextVolume > 0) {
      this.previousVolume = nextVolume;
      localStorage.setItem(this.previousVolumeStorageKey, nextVolume.toString());
      this.isMuted.set(false);
      localStorage.setItem(this.mutedStorageKey, 'false');
    } else {
      this.isMuted.set(true);
      localStorage.setItem(this.mutedStorageKey, 'true');
    }
  }

  public toggleMute(): void {
    if (this.isMuted() || this.value === 0) {
      this.setVolume(this.getStoredPreviousVolume());
      return;
    }

    this.previousVolume = this.value;
    localStorage.setItem(this.previousVolumeStorageKey, this.value.toString());
    this.setVolume(0);
  }

  public volumeIcon(): string {
    if (this.value === 0 || this.isMuted()) {
      return 'volume_off';
    }

    if (this.value < 45) {
      return 'volume_down';
    }

    return 'volume_up';
  }

  onLoadedMetadata(player: HTMLAudioElement) {
    if (Number.isFinite(player.duration)) {
      this.duration.set(player.duration);
    }
  }

  public toggleQueue(): void {
    this.isQueueOpen.update((isOpen) => !isOpen);
  }

  public playQueuedSong(song: SongType): void {
    this.player.setPlayer(song.id.toString());
    this.player.setIsClose(false);
    this.router.navigate(['/song', song.id]);
  }

  public playNext(): void {
    const nextSongId = this.playbackQueue.next();
    if (nextSongId) {
      this.setSongByLocalStorage();
      this.router.navigate(['/song', nextSongId]);
    }
  }

  public handlePlaybackEnded(player: HTMLAudioElement): void {
    if (this.playbackQueue.playbackMode() === 'repeat-one') {
      player.currentTime = 0;
      player.play();
      return;
    }

    const nextSongId = this.playbackQueue.nextAfterEnded();
    if (nextSongId) {
      this.setSongByLocalStorage();
      this.router.navigate(['/song', nextSongId]);
    }
  }

  public playPrevious(): void {
    const previousSongId = this.playbackQueue.previous();
    if (previousSongId) {
      this.setSongByLocalStorage();
      this.router.navigate(['/song', previousSongId]);
    }
  }

  public toggleShuffleMode(): void {
    this.playbackQueue.toggleShuffle();
  }

  public cycleRepeatMode(): void {
    this.playbackQueue.cycleRepeatMode();
  }

  public repeatIcon(): string {
    if (this.playbackQueue.playbackMode() === 'repeat-one') {
      return 'repeat_one_on';
    }

    if (this.playbackQueue.playbackMode() === 'repeat-all') {
      return 'repeat_on';
    }

    return 'repeat';
  }

  public playbackModeLabel(): string {
    const labels = {
      shuffle: '隨機播放',
      'repeat-one': '單曲循環',
      'repeat-all': '佇列循環',
      'no-repeat': '不重複播放',
    };

    return labels[this.playbackQueue.playbackMode()];
  }

  private getStoredVolume(): number {
    const storedVolume = Number(localStorage.getItem(this.volumeStorageKey));
    if (Number.isFinite(storedVolume) && storedVolume >= 0 && storedVolume <= 100) {
      return storedVolume;
    }

    return 70;
  }

  private restoreMutedState(): void {
    this.isMuted.set(localStorage.getItem(this.mutedStorageKey) === 'true' || this.value === 0);
    this.previousVolume = this.getStoredPreviousVolume();
    if (this.value > 0) {
      this.previousVolume = this.value;
      localStorage.setItem(this.previousVolumeStorageKey, this.value.toString());
    }
  }

  private getStoredPreviousVolume(): number {
    const storedVolume = Number(localStorage.getItem(this.previousVolumeStorageKey));
    if (Number.isFinite(storedVolume) && storedVolume > 0 && storedVolume <= 100) {
      return storedVolume;
    }

    return this.previousVolume || 70;
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
    const songId = localStorage.getItem('songId');
    if (!songId) {
      return;
    }

    this.currentSongId.set(songId);
    this.player.getPlayer(songId).subscribe((res) => {
      this.currentSong.set(res[0]);
      if (res[0]) {
        this.playbackQueue.ensureSingleSongQueue(res[0]);
      }
    });
  }

  public songImage(song: SongType): string {
    return song.imgPath || song.album?.imgPath || './mock/unnamed.png';
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
