import { Component, Input, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import { ApiService, SongType, UserType } from '../../@service/api.service';
import { AuthService } from '../../@service/auth.service';
import { FavoritePlaylistService } from '../../@service/favorite-playlist.service';
import { MusicPlayerService } from '../../@service/music-player.service';
import { NavigationContextService } from '../../@service/navigation-context.service';
import { PlaybackQueueService } from '../../@service/playback-queue.service';
import { SearchStateService } from '../../@service/search-state.service';

@Component({
  selector: 'app-song-list',
  imports: [MatIconModule],
  templateUrl: './song-list.html',
  styleUrl: './song-list.scss',
})
export class SongList {
  private api: ApiService = inject(ApiService);
  private auth: AuthService = inject(AuthService);
  private favoritePlaylist: FavoritePlaylistService = inject(FavoritePlaylistService);
  private music: MusicPlayerService = inject(MusicPlayerService);
  private playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  private router: Router = inject(Router);
  private navigationContext: NavigationContextService = inject(NavigationContextService);
  private searchState: SearchStateService = inject(SearchStateService);

  @Input() title = '歌曲';
  @Input() emptyText = '找不到符合條件的歌曲';
  @Input()
  set searchTerm(value: string | null | undefined) {
    this.query.set(value ?? '');
    this.currentPage.set(1);
  }

  public songs = signal<SongType[]>([]);
  public favoriteSongIds = signal<Set<number>>(new Set());
  public query = signal('');
  public currentPage = signal(1);
  public pageSize = 10;

  ngOnInit() {
    this.loadSongs();
    this.loadFavoriteSongs();
  }

  public filteredSongs(): SongType[] {
    const keyword = this.query().trim().toLowerCase();
    if (!keyword) {
      return this.songs();
    }

    return this.songs().filter((song) => {
      const fields = [song.name, song.artist?.name, song.album?.name];
      return fields.some((field) => field?.toLowerCase().includes(keyword));
    });
  }

  public pagedSongs(): SongType[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredSongs().slice(start, start + this.pageSize);
  }

  public totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredSongs().length / this.pageSize));
  }

  public setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  public playSong(song: SongType): void {
    this.playbackQueue.setQueue(
      {
        title: this.title,
        source: 'search',
        songs: [song],
        autoSongs: this.shuffleSongs(
          this.filteredSongs().filter((item) => item.id !== song.id),
          song.id,
        ),
        recommendationPool: this.filteredSongs(),
      },
      song.id,
    );
    this.music.setPlayer(song.id.toString());
    this.music.setIsClose(false);
    this.navigationContext.setSongBackUrl(this.router.url);
    this.searchState.closeSearch();
    this.router.navigate(['/song', song.id]);
  }

  public isFavorite(songId: number): boolean {
    return this.favoriteSongIds().has(songId);
  }

  public async addToFavorite(songId: number, event: MouseEvent): Promise<void> {
    event.stopPropagation();

    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      this.showAlert('請先登入', '登入後才能把歌曲加入最愛。', 'warning');
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
    this.playbackQueue.addToQueue(song, this.filteredSongs());
    this.showAlert('已加入佇列', '歌曲已加入播放佇列。', 'success', 900);
  }

  public songImage(song: SongType): string {
    return song.imgPath || song.album?.imgPath || './mock/unnamed.png';
  }

  private loadSongs(): void {
    this.api.getAllSong().subscribe({
      next: (songs) => this.songs.set(songs),
      error: (err) => console.error('取得歌曲失敗：', err),
    });
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

  private shuffleSongs(songs: SongType[], currentSongId: number): SongType[] {
    const currentSong = songs.find((item) => item.id === currentSongId);
    const restSongs = songs.filter((item) => item.id !== currentSongId);

    for (let index = restSongs.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [restSongs[index], restSongs[randomIndex]] = [restSongs[randomIndex], restSongs[index]];
    }

    return currentSong ? [currentSong, ...restSongs] : restSongs;
  }
}
