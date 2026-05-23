import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Swal from 'sweetalert2';
import { ApiService, availabilityMessage, isSongPlayable, SongType } from '../../@service/api.service';
import { AuthService } from '../../@service/auth.service';
import { MusicPlayerService } from '../../@service/music-player.service';
import { PlaybackQueueService } from '../../@service/playback-queue.service';
import { TimePipe } from '../../@pipe/time-pipe';

@Component({
  selector: 'app-player',
  imports: [MatIcon, MatSliderModule, RouterLink, FormsModule],
  templateUrl: './player.html',
  styleUrl: './player.scss',
  providers: [TimePipe],
})
export class Player {
  public player: MusicPlayerService = inject(MusicPlayerService);
  private router: Router = inject(Router);
  private api: ApiService = inject(ApiService);
  private auth: AuthService = inject(AuthService);
  public playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);

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
  private countedForCurrentPlay = false;
  private trackedSongId: number | null = null;
  value = this.getStoredVolume();
  showTicks = false;
  duration = signal<number>(0);

  constructor() {
    effect(() => {
      const songId = this.playbackQueue.currentSongId();
      if (!songId || songId.toString() === this.currentSongId()) {
        return;
      }

      this.setSongByLocalStorage();
    });
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

  public handleTimeUpdate(player: HTMLAudioElement): void {
    this.currentTime = player.currentTime;
    this.recordPlayCountIfQualified(player);
  }

  public toggleQueue(): void {
    this.isQueueOpen.update((isOpen) => !isOpen);
  }

  public playQueuedSong(song: SongType): void {
    this.player.setPlayer(song.id.toString());
    this.player.setIsClose(false);
    this.setSongByLocalStorage();
  }

  public playNext(): void {
    const nextSongId = this.playbackQueue.next();
    if (nextSongId) {
      this.setSongByLocalStorage();
    }
  }

  public handlePlaybackEnded(player: HTMLAudioElement): void {
    if (this.playbackQueue.playbackMode() === 'repeat-one') {
      this.countedForCurrentPlay = false;
      player.currentTime = 0;
      player.play();
      return;
    }

    const nextSongId = this.playbackQueue.nextAfterEnded();
    if (nextSongId) {
      this.setSongByLocalStorage();
    }
  }

  public playPrevious(): void {
    const previousSongId = this.playbackQueue.previous();
    if (previousSongId) {
      this.setSongByLocalStorage();
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
        if (!isSongPlayable(res[0])) {
          this.musicPlayer.pause();
          this.musicPlayer.removeAttribute('src');
          this.musicPlayer.load();
          Swal.fire('無法播放', `這首歌${availabilityMessage(res[0])}。`, 'info');
          return;
        }

        if (this.trackedSongId !== res[0].id) {
          this.trackedSongId = res[0].id;
          this.countedForCurrentPlay = false;
        }
        this.playbackQueue.ensureSingleSongQueue(res[0]);
      }
    });
  }

  private recordPlayCountIfQualified(player: HTMLAudioElement): void {
    const song = this.currentSong();
    if (!song || this.countedForCurrentPlay || !Number.isFinite(player.duration)) {
      return;
    }

    const threshold = player.duration >= 30 ? 10 : player.duration * 0.5;
    if (player.currentTime < threshold) {
      return;
    }

    this.countedForCurrentPlay = true;
    this.api.createSongPlay({
      songId: song.id,
      userId: this.auth.user()?.id ?? null,
      playedAt: new Date().toISOString(),
      duration: Math.round(player.duration),
      listenedSeconds: Math.round(player.currentTime),
    }).subscribe({
      next: () => this.currentSong.set({ ...song, playCount: (song.playCount ?? 0) + 1 }),
      error: (err) => {
        if (err?.status === 404) {
          this.updateSongPlayCountFallback(song);
          return;
        }

        this.countedForCurrentPlay = false;
        console.error('記錄播放事件失敗：', err);
      },
    });
  }

  private updateSongPlayCountFallback(song: SongType): void {
    const nextPlayCount = (song.playCount ?? 0) + 1;
    this.api.updateSong(song.id, { playCount: nextPlayCount }).subscribe({
      next: () => this.currentSong.set({ ...song, playCount: nextPlayCount }),
      error: (err) => {
        this.countedForCurrentPlay = false;
        console.error('更新播放次數失敗：', err);
      },
    });
  }

  public songImage(song: SongType): string {
    return song.imgPath || song.album?.imgPath || './mock/unnamed.png';
  }

  closePlayer(boolean: boolean) {
    this.player.setIsClose(boolean);
  }

  formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
