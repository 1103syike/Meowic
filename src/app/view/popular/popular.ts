import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import {
  ApiService,
  availabilityMessage,
  isSongPlayable,
  SongPlayType,
  SongType,
  UserType,
} from '../../@service/api.service';
import { AuthService } from '../../@service/auth.service';
import { FavoritePlaylistService } from '../../@service/favorite-playlist.service';
import { MusicPlayerService } from '../../@service/music-player.service';
import { NavigationContextService } from '../../@service/navigation-context.service';
import { PlaybackQueueService } from '../../@service/playback-queue.service';
import { SearchStateService } from '../../@service/search-state.service';

type PopularRange = 'all' | '30d' | '7d' | 'today';

interface PopularRangeOption {
  key: PopularRange;
  label: string;
}

interface RankedSong {
  song: SongType;
  plays: number;
}

@Component({
  selector: 'app-popular',
  imports: [MatIconModule],
  templateUrl: './popular.html',
  styleUrl: './popular.scss',
})
export class Popular {
  private api: ApiService = inject(ApiService);
  private auth: AuthService = inject(AuthService);
  private favoritePlaylist: FavoritePlaylistService = inject(FavoritePlaylistService);
  private music: MusicPlayerService = inject(MusicPlayerService);
  private navigationContext: NavigationContextService = inject(NavigationContextService);
  private playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  private router: Router = inject(Router);
  private searchState: SearchStateService = inject(SearchStateService);

  public readonly ranges: PopularRangeOption[] = [
    { key: 'all', label: '全站' },
    { key: '30d', label: '近三十天' },
    { key: '7d', label: '近七天' },
    { key: 'today', label: '今日' },
  ];

  public activeRange = signal<PopularRange>('all');
  public songs = signal<SongType[]>([]);
  public songPlays = signal<SongPlayType[]>([]);
  public favoriteSongIds = signal<Set<number>>(new Set());

  public rankedSongs = computed(() => this.getRankedSongs(this.activeRange()));

  ngOnInit() {
    this.loadRankingData();
    this.loadFavoriteSongs();
  }

  public setRange(range: PopularRange): void {
    this.activeRange.set(range);
  }

  public playSong(song: SongType): void {
    if (!isSongPlayable(song)) {
      this.showAlert('無法播放', `這首歌${availabilityMessage(song)}。`, 'info');
      return;
    }

    const currentSongs = this.rankedSongs().map((item) => item.song);
    this.playbackQueue.setQueue(
      {
        title: '熱門歌曲',
        source: 'search',
        songs: [song],
        autoSongs: currentSongs.filter((item) => item.id !== song.id),
        recommendationPool: currentSongs,
      },
      song.id,
    );
    this.music.setPlayer(song.id.toString());
    this.music.setIsClose(false);
    this.navigationContext.setSongBackUrl(this.router.url);
    this.searchState.closeSearch();
    this.router.navigate(['/song', song.id]);
  }

  public songImage(song: SongType): string {
    return song.imgPath || song.album?.imgPath || './mock/unnamed.png';
  }

  public isFavorite(songId: number): boolean {
    return this.favoriteSongIds().has(songId);
  }

  public async addToFavorite(songId: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();

    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      this.showAlert('請先登入', '登入後才能把歌曲加入喜歡。', 'warning');
      return;
    }

    await this.favoritePlaylist.addSongToFavorite(currentUser.id, songId);
    this.favoriteSongIds.update((ids) => new Set(ids).add(songId));
  }

  public async addToPlaylist(songId: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();

    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      this.showAlert('請先登入', '登入後才能把歌曲加入播放清單。', 'warning');
      return;
    }

    const playlistUsers = await firstValueFrom(
      this.api.getPlaylistUsersByUserId(currentUser.id.toString()),
    );
    const editablePlaylistUsers = playlistUsers.filter(
      (playlistUser) => playlistUser.playlist.type !== 'favorite',
    );

    if (editablePlaylistUsers.length === 0) {
      this.showAlert('沒有可加入的播放清單', '請先建立播放清單後再加入歌曲。', 'info');
      return;
    }

    const result = await Swal.fire({
      title: '加入播放清單',
      input: 'select',
      inputOptions: editablePlaylistUsers.reduce<Record<string, string>>((options, item) => {
        options[item.playlist.id] = item.playlist.name;
        return options;
      }, {}),
      inputPlaceholder: '選擇播放清單',
      showCancelButton: true,
      confirmButtonText: '加入',
      cancelButtonText: '取消',
      showLoaderOnConfirm: true,
      inputValidator: (value) => (!value ? '請選擇一個播放清單' : null),
      preConfirm: async (value) => {
        const playlistId = Number(value);
        const playlistSongs = await firstValueFrom(
          this.api.getAllSongByPlaylistId(playlistId.toString()),
        );

        if (playlistSongs.some((item) => item.songId === songId)) {
          Swal.showValidationMessage('這首歌已經在此播放清單中');
          return false;
        }

        await firstValueFrom(this.api.addSongToPlaylist(playlistId, songId));
        return true;
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (result.isConfirmed) {
      this.showAlert('加入成功', '歌曲已加入播放清單。', 'success', 1200);
    }
  }

  public addToQueue(song: SongType, event: MouseEvent): void {
    event.stopPropagation();
    if (!isSongPlayable(song)) {
      this.showAlert('無法加入佇列', `這首歌${availabilityMessage(song)}。`, 'info');
      return;
    }

    this.playbackQueue.addToQueue(song, this.rankedSongs().map((item) => item.song));
    this.showAlert('已加入佇列', '歌曲已加入播放佇列。', 'success', 900);
  }

  private async loadRankingData(): Promise<void> {
    const songs = await firstValueFrom(this.api.getAllSong());
    const songPlays = await firstValueFrom(this.api.getAllSongPlays()).catch((err) => {
      console.error('取得播放紀錄失敗：', err);
      return [];
    });

    this.songs.set(songs);
    this.songPlays.set(songPlays);
  }

  private async loadFavoriteSongs(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) {
      this.favoriteSongIds.set(new Set());
      return;
    }

    this.favoriteSongIds.set(await this.favoritePlaylist.getFavoriteSongIds(user.id));
  }

  private async getCurrentUser(): Promise<UserType | null> {
    const user = this.auth.user();
    if (user) {
      return user;
    }

    const userRequest = this.auth.getUserInfo();
    if (!userRequest) {
      return null;
    }

    const users = await firstValueFrom(userRequest);
    return users[0] ?? null;
  }

  private showAlert(title: string, text: string, icon: SweetAlertIcon, timer?: number): void {
    Swal.fire({
      title,
      text,
      icon,
      timer,
      showConfirmButton: timer === undefined,
    });
  }

  private getRankedSongs(range: PopularRange): RankedSong[] {
    const rangeStart = this.getRangeStart(range);
    const counts = new Map<number, number>();

    this.songPlays()
      .filter((play) => !rangeStart || new Date(play.playedAt).getTime() >= rangeStart.getTime())
      .forEach((play) => counts.set(play.songId, (counts.get(play.songId) ?? 0) + 1));

    const useSongPlayCountFallback = this.songPlays().length === 0;

    return this.songs()
      .map((song) => ({
        song,
        plays: useSongPlayCountFallback ? song.playCount ?? 0 : counts.get(song.id) ?? 0,
      }))
      .filter((item) => item.plays > 0)
      .sort((a, b) => b.plays - a.plays || a.song.name.localeCompare(b.song.name))
      .slice(0, 50);
  }

  private getRangeStart(range: PopularRange): Date | null {
    const now = new Date();

    if (range === 'all') {
      return null;
    }

    if (range === 'today') {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const days = range === '30d' ? 30 : 7;
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
}
