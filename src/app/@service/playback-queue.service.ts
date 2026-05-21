import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService, SongType } from './api.service';

export type PlaybackQueueSource = 'album' | 'playlist' | 'search' | 'temporary';
export type PlaybackMode = 'shuffle' | 'repeat-one' | 'repeat-all' | 'no-repeat';

export interface PlaybackQueue {
  title: string;
  source: PlaybackQueueSource;
  songs: SongType[];
  autoSongs?: SongType[];
  recommendationPool?: SongType[];
}

@Injectable({ providedIn: 'root' })
export class PlaybackQueueService {
  private api: ApiService = inject(ApiService);
  private readonly queueStorageKey = 'playbackQueue';
  private readonly modeStorageKey = 'playbackMode';
  private readonly autoQueueSize = 5;
  private queueState = signal<PlaybackQueue>(this.getStoredQueue());
  private currentSongIdState = signal<number | null>(this.getStoredSongId());
  private playbackModeState = signal<PlaybackMode>(this.getStoredMode());

  public queue = this.queueState.asReadonly();
  public currentSongId = this.currentSongIdState.asReadonly();
  public playbackMode = this.playbackModeState.asReadonly();
  public manualSongs = computed(() => this.queueState().songs);
  public autoSongs = computed(() => this.queueState().autoSongs ?? []);
  public displaySongs = computed(() => [...this.manualSongs(), ...this.autoSongs()]);
  public currentIndex = computed(() => {
    const currentSongId = this.currentSongIdState();
    return this.displaySongs().findIndex((song) => song.id === currentSongId);
  });

  public setQueue(queue: PlaybackQueue, currentSongId: number): void {
    const manualSongs = this.uniqueSongs(queue.songs);
    const recommendationPool = this.uniqueSongs(queue.recommendationPool ?? [
      ...manualSongs,
      ...(queue.autoSongs ?? []),
    ]);

    this.queueState.set({
      ...queue,
      songs: manualSongs,
      autoSongs: this.fillAutoSongs(queue.autoSongs ?? [], manualSongs, recommendationPool),
      recommendationPool,
    });
    this.saveQueue();
    this.setCurrentSong(currentSongId);
    this.ensureAutoQueue();
  }

  public setTemporaryQueue(songs: SongType[], currentSongId: number): void {
    this.setQueue(
      {
        title: '一次性播放佇列',
        source: 'temporary',
        songs: songs.filter((song) => song.id === currentSongId),
        autoSongs: songs.filter((song) => song.id !== currentSongId),
        recommendationPool: songs,
      },
      currentSongId,
    );
  }

  public addToQueue(song: SongType, recommendations: SongType[] = []): void {
    const queue = this.queueState();
    const manualSongs = this.uniqueSongs([...queue.songs, song]);
    const manualSongIds = new Set(manualSongs.map((item) => item.id));
    const currentAutoSongs = queue.autoSongs ?? [];
    const recommendationPool = this.uniqueSongs([
      ...(queue.recommendationPool ?? []),
      ...recommendations,
      song,
    ]);
    const nextAutoSongs =
      currentAutoSongs.length > 0
        ? currentAutoSongs.filter((item) => !manualSongIds.has(item.id))
        : this.shuffleSongs(
            recommendationPool.filter((item) => !manualSongIds.has(item.id)),
            song.id,
          );

    this.queueState.set({
      ...queue,
      songs: manualSongs,
      autoSongs: this.fillAutoSongs(nextAutoSongs, manualSongs, recommendationPool),
      recommendationPool,
    });
    this.saveQueue();
    this.ensureAutoQueue();
  }

  public setCurrentSong(songId: number): void {
    this.currentSongIdState.set(songId);
    localStorage.setItem('songId', songId.toString());
  }

  public setPlaybackMode(mode: PlaybackMode): void {
    this.playbackModeState.set(mode);
    localStorage.setItem(this.modeStorageKey, mode);
  }

  public cycleRepeatMode(): void {
    const currentMode = this.playbackModeState();

    if (currentMode === 'repeat-all') {
      this.setPlaybackMode('repeat-one');
      return;
    }

    if (currentMode === 'repeat-one') {
      this.setPlaybackMode('no-repeat');
      return;
    }

    this.setPlaybackMode('repeat-all');
  }

  public toggleShuffle(): void {
    if (this.playbackModeState() === 'shuffle') {
      this.setPlaybackMode('no-repeat');
      return;
    }

    this.shuffleManualQueue();
    this.setPlaybackMode('shuffle');
  }

  public next(): number | null {
    return this.getNextSongId(false);
  }

  public nextAfterEnded(): number | null {
    return this.getNextSongId(true);
  }

  private getNextSongId(isAutoEnded: boolean): number | null {
    const songs = this.displaySongs();
    if (songs.length === 0) {
      return null;
    }

    if (this.playbackModeState() === 'repeat-one' && isAutoEnded) {
      const currentSongId = this.currentSongIdState();
      return currentSongId;
    }

    const currentIndex = this.currentIndex();
    if (
      this.playbackModeState() === 'no-repeat' &&
      isAutoEnded &&
      currentIndex === songs.length - 1
    ) {
      return null;
    }

    if (
      this.playbackModeState() === 'no-repeat' &&
      !isAutoEnded &&
      currentIndex === songs.length - 1
    ) {
      return null;
    }

    const previousSongId = this.currentSongIdState();
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % songs.length : 0;
    this.setCurrentSong(songs[nextIndex].id);
    if (previousSongId !== null) {
      this.removeFromAutoQueue(previousSongId);
    }
    return songs[nextIndex].id;
  }

  public previous(): number | null {
    const songs = this.displaySongs();
    if (songs.length === 0) {
      return null;
    }

    const currentIndex = this.currentIndex();
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : songs.length - 1;
    this.setCurrentSong(songs[previousIndex].id);
    return songs[previousIndex].id;
  }

  public ensureSingleSongQueue(song: SongType): void {
    if (this.displaySongs().length > 0) {
      return;
    }

    this.setQueue(
      {
        title: '一次性播放佇列',
        source: 'temporary',
        songs: [song],
      },
      song.id,
    );
  }

  private uniqueSongs(songs: SongType[]): SongType[] {
    const songMap = new Map<number, SongType>();
    songs.forEach((song) => songMap.set(song.id, song));
    return [...songMap.values()];
  }

  private shuffleManualQueue(): void {
    const queue = this.queueState();
    const currentSongId = this.currentSongIdState();
    const currentSong = queue.songs.find((song) => song.id === currentSongId);
    const shuffledSongs = this.shuffleSongs(
      queue.songs.filter((song) => song.id !== currentSongId),
      currentSongId ?? 0,
    );

    this.queueState.set({
      ...queue,
      songs: currentSong ? [currentSong, ...shuffledSongs] : shuffledSongs,
    });
    this.saveQueue();
  }

  private shuffleSongs(songs: SongType[], currentSongId: number): SongType[] {
    const currentSong = songs.find((song) => song.id === currentSongId);
    const restSongs = songs.filter((song) => song.id !== currentSongId);

    for (let index = restSongs.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [restSongs[index], restSongs[randomIndex]] = [restSongs[randomIndex], restSongs[index]];
    }

    return currentSong ? [currentSong, ...restSongs] : restSongs;
  }

  private fillAutoSongs(
    autoSongs: SongType[],
    manualSongs: SongType[],
    recommendationPool: SongType[],
  ): SongType[] {
    const manualSongIds = new Set(manualSongs.map((song) => song.id));
    const nextAutoSongs = this.uniqueSongs(autoSongs).filter((song) => !manualSongIds.has(song.id));

    if (nextAutoSongs.length >= this.autoQueueSize) {
      return nextAutoSongs.slice(0, this.autoQueueSize);
    }

    const usedSongIds = new Set([...manualSongIds, ...nextAutoSongs.map((song) => song.id)]);
    const candidates = this.shuffleSongs(
      recommendationPool.filter((song) => !usedSongIds.has(song.id)),
      this.currentSongIdState() ?? 0,
    );

    return [...nextAutoSongs, ...candidates].slice(0, this.autoQueueSize);
  }

  private async ensureAutoQueue(): Promise<void> {
    const queue = this.queueState();
    if ((queue.autoSongs?.length ?? 0) >= this.autoQueueSize) {
      return;
    }

    const allSongs = await firstValueFrom(this.api.getAllSong());
    const recommendationPool = this.uniqueSongs([...(queue.recommendationPool ?? []), ...allSongs]);
    this.queueState.set({
      ...queue,
      autoSongs: this.fillAutoSongs(queue.autoSongs ?? [], queue.songs, recommendationPool),
      recommendationPool,
    });
    this.saveQueue();
  }

  private removeFromAutoQueue(songId: number): void {
    const queue = this.queueState();
    if (!queue.autoSongs?.some((song) => song.id === songId)) {
      return;
    }

    this.queueState.set({
      ...queue,
      autoSongs: this.fillAutoSongs(
        queue.autoSongs.filter((song) => song.id !== songId),
        queue.songs,
        queue.recommendationPool ?? [],
      ),
    });
    this.saveQueue();
    this.ensureAutoQueue();
  }

  private saveQueue(): void {
    localStorage.setItem(this.queueStorageKey, JSON.stringify(this.queueState()));
  }

  private getStoredQueue(): PlaybackQueue {
    const fallbackQueue: PlaybackQueue = {
      title: '播放佇列',
      source: 'temporary',
      songs: [],
      autoSongs: [],
    };

    try {
      const storedQueue = localStorage.getItem(this.queueStorageKey);
      if (!storedQueue) {
        return fallbackQueue;
      }

      const parsedQueue = JSON.parse(storedQueue) as PlaybackQueue;
      if (!Array.isArray(parsedQueue.songs)) {
        return fallbackQueue;
      }

      return {
        ...parsedQueue,
        autoSongs: Array.isArray(parsedQueue.autoSongs) ? parsedQueue.autoSongs : [],
        recommendationPool: Array.isArray(parsedQueue.recommendationPool)
          ? parsedQueue.recommendationPool
          : [],
      };
    } catch {
      return fallbackQueue;
    }
  }

  private getStoredMode(): PlaybackMode {
    const mode = localStorage.getItem(this.modeStorageKey);
    if (
      mode === 'shuffle' ||
      mode === 'repeat-one' ||
      mode === 'repeat-all' ||
      mode === 'no-repeat'
    ) {
      return mode;
    }

    return 'no-repeat';
  }

  private getStoredSongId(): number | null {
    const songId = Number(localStorage.getItem('songId'));
    return Number.isFinite(songId) && songId > 0 ? songId : null;
  }
}
