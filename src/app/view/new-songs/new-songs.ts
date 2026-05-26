import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  ApiService,
  availabilityMessage,
  isSongPlayable,
  SongType,
  UserType,
} from '../../@service/api.service';
import { AuthService } from '../../@service/auth.service';
import { FavoritePlaylistService } from '../../@service/favorite-playlist.service';
import { MusicPlayerService } from '../../@service/music-player.service';
import { NavigationContextService } from '../../@service/navigation-context.service';
import { PlaybackQueueService } from '../../@service/playback-queue.service';
import { SearchStateService } from '../../@service/search-state.service';
import Swal, { SweetAlertIcon } from 'sweetalert2';

type NewSongGroup = 'uploaded' | 'released';

@Component({
  selector: 'app-new-songs',
  imports: [MatIconModule, RouterLink],
  templateUrl: './new-songs.html',
  styleUrl: './new-songs.scss',
})
export class NewSongs {
  private api: ApiService = inject(ApiService);
  private auth: AuthService = inject(AuthService);
  private favoritePlaylist: FavoritePlaylistService = inject(FavoritePlaylistService);
  private music: MusicPlayerService = inject(MusicPlayerService);
  private navigationContext: NavigationContextService = inject(NavigationContextService);
  private playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  private router: Router = inject(Router);
  private searchState: SearchStateService = inject(SearchStateService);

  public songs = signal<SongType[]>([]);
  public favoriteSongIds = signal<Set<number>>(new Set());
  public activeGroup = signal<NewSongGroup>('uploaded');

  public uploadedSongs = computed(() =>
    this.getRecentSongs('uploadedAt').sort((a, b) => this.dateValue(b.uploadedAt) - this.dateValue(a.uploadedAt)),
  );

  public releasedSongs = computed(() =>
    this.getRecentSongs('releaseDate').sort(
      (a, b) =>
        this.dateValue(b.releaseDate || b.album?.releaseDate) -
        this.dateValue(a.releaseDate || a.album?.releaseDate),
    ),
  );

  public activeSongs = computed(() =>
    this.activeGroup() === 'uploaded' ? this.uploadedSongs() : this.releasedSongs(),
  );

  ngOnInit(): void {
    this.api.getAllSong().subscribe((songs) => this.songs.set(songs));
    this.loadFavoriteSongs();
  }

  public setGroup(group: NewSongGroup): void {
    this.activeGroup.set(group);
  }

  public playSong(song: SongType): void {
    if (!isSongPlayable(song)) {
      Swal.fire('目前不能播放', `這首歌${availabilityMessage(song)}。`, 'info');
      return;
    }

    const groupTitle = this.activeGroup() === 'uploaded' ? '新上傳的歌' : '發行最新的歌';
    const currentSongs = this.activeSongs();
    this.playbackQueue.setQueue(
      {
        title: groupTitle,
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
      this.showAlert('還沒有播放清單', '請先建立播放清單，再加入歌曲。', 'info');
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
      inputValidator: (value) => (!value ? '請選擇播放清單' : null),
      preConfirm: async (value) => {
        const playlistId = Number(value);
        const playlistSongs = await firstValueFrom(
          this.api.getAllSongByPlaylistId(playlistId.toString()),
        );

        if (playlistSongs.some((item) => item.songId === songId)) {
          Swal.showValidationMessage('這首歌已經在播放清單裡。');
          return false;
        }

        await firstValueFrom(this.api.addSongToPlaylist(playlistId, songId));
        return true;
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (result.isConfirmed) {
      this.showAlert('已加入', '歌曲已加入播放清單。', 'success', 1200);
    }
  }

  public addToQueue(song: SongType, event: MouseEvent): void {
    event.stopPropagation();
    if (!isSongPlayable(song)) {
      this.showAlert('目前不能加入佇列', `這首歌${availabilityMessage(song)}。`, 'info');
      return;
    }

    this.playbackQueue.addToQueue(song, this.activeSongs());
    this.showAlert('已加入佇列', '歌曲已加入播放佇列。', 'success', 900);
  }

  public songDate(song: SongType): string {
    const value = this.activeGroup() === 'uploaded' ? song.uploadedAt : song.releaseDate || song.album?.releaseDate;
    return this.formatDateTime(value);
  }

  public rangeLabel(): string {
    return `只顯示 ${this.formatDate(this.monthAgo())} 以後的歌曲`;
  }

  private getRecentSongs(field: 'uploadedAt' | 'releaseDate'): SongType[] {
    const cutoff = this.monthAgo().getTime();

    return this.songs().filter((song) => {
      const value = field === 'uploadedAt' ? song.uploadedAt : song.releaseDate || song.album?.releaseDate;
      const time = this.dateValue(value);
      return time >= cutoff && time <= Date.now();
    });
  }

  private monthAgo(): Date {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
  }

  private dateValue(value: string | null | undefined): number {
    const date = this.parseDate(value);
    return date?.getTime() ?? 0;
  }

  private parseDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private formatDateTime(value: string | null | undefined): string {
    const date = this.parseDate(value);
    if (!date) {
      return '未設定時間';
    }

    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatDate(value: Date): string {
    return value.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private async loadFavoriteSongs(): Promise<void> {
    const user = await this.getCurrentUser();
    this.favoriteSongIds.set(user ? await this.favoritePlaylist.getFavoriteSongIds(user.id) : new Set());
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
}
