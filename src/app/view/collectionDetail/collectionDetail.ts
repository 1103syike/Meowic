import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import { ApiService, AlbumType, SongType, UserType } from '../../@service/api.service';
import { AuthService } from '../../@service/auth.service';
import { FavoritePlaylistService } from '../../@service/favorite-playlist.service';
import { MusicPlayerService } from '../../@service/music-player.service';
import { NavigationContextService } from '../../@service/navigation-context.service';

@Component({
  selector: 'app-album',
  imports: [MatIconModule, MatTableModule, RouterLink],
  templateUrl: './collectionDetail.html',
  styleUrl: './collectionDetail.scss',
})
export class CollectionDetailComponent {
  private route: ActivatedRoute = inject(ActivatedRoute);
  private api: ApiService = inject(ApiService);
  private music: MusicPlayerService = inject(MusicPlayerService);
  private auth: AuthService = inject(AuthService);
  private favoritePlaylist: FavoritePlaylistService = inject(FavoritePlaylistService);
  private navigationContext: NavigationContextService = inject(NavigationContextService);

  public displayedColumns: string[] = ['id', 'name', 'album', 'time', 'tool'];
  public songList = signal<SongType[] | null>(null);
  public currentCollection = signal<AlbumType | null>(null);
  public favoriteSongIds = signal<Set<number>>(new Set());

  ngOnInit() {
    this.loadFavoriteSongs();

    if (this.currentRouteType === 'album') {
      this.route.paramMap.subscribe((data) => {
        const albumId = data.get('id') as string;
        this.getAlbumByAlbumId(albumId);
        this.getAllSongByAlbumId(albumId);
      });
    } else if (this.currentRouteType === 'playlist') {
      this.route.paramMap.subscribe((data) => {
        const playlistId = data.get('id') as string;
        this.getPlaylistByPlaylistId(playlistId);
        this.getAllSongByPlaylistId(playlistId);
      });
    }
  }

  private get currentRouteType(): string {
    return this.route.snapshot.url[0]?.path ?? '';
  }

  private get currentRouteId(): string {
    return this.route.snapshot.paramMap.get('id') ?? '';
  }

  private getPlaylistByPlaylistId(playlistId: string) {
    this.api.getPlaylistByPlaylistId(playlistId).subscribe({
      next: (res: AlbumType[]) => {
        this.currentCollection.set(res[0]);
      },
      error: (err) => {
        console.error('取得播放清單失敗：', err);
      },
    });
  }

  private getAllSongByPlaylistId(playlistId: string) {
    this.api.getAllSongByPlaylistId(playlistId).subscribe({
      next: (res) => {
        if (res.length === 0) {
          this.songList.set([]);
          return;
        }

        const requests = res.map((item) => this.api.getSongById(item.songId.toString()));

        forkJoin(requests).subscribe((songs) => {
          this.songList.set(
            songs.map((song, index) => ({
              ...song[0],
              playlistSongId: res[index].id,
            })),
          );
          this.checkAudioLoaded(this.songList()!);
        });
      },
      error: (err) => {
        console.error('取得播放清單歌曲失敗：', err);
      },
    });
  }

  private getAlbumByAlbumId(albumId: string) {
    this.api.getAlbumByAlbumId(albumId).subscribe({
      next: (res: AlbumType[]) => {
        this.currentCollection.set(res[0]);
      },
      error: (err) => {
        console.error('取得專輯失敗：', err);
      },
    });
  }

  private getAllSongByAlbumId(albumId: string) {
    this.api.getAllSongByAlbumId(albumId).subscribe({
      next: (res: SongType[]) => {
        this.songList.set(res);
        this.checkAudioLoaded(this.songList()!);
      },
      error: (err) => {
        console.error('取得專輯歌曲失敗：', err);
      },
    });
  }

  private checkAudioLoaded(res: SongType[]) {
    res.forEach((song) => {
      const audio = new Audio(song.audioPath);

      audio.onloadedmetadata = () => {
        song.length = this.formatTime(audio.duration);
        this.songList.set([...res]);
      };

      audio.onerror = () => {
        song.length = '--:--';
        this.songList.set([...res]);
      };
    });
  }

  public setPlayer(id: string) {
    this.music.setPlayer(id);
    this.music.setIsClose(false);
    this.navigationContext.setSongBackUrl(this.currentRouteType === 'playlist' ? `/playlist/${this.currentRouteId}` : `/album/${this.currentRouteId}`);
  }

  public formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  public async addToPlaylist(songId: number, $event: MouseEvent): Promise<void> {
    $event.stopPropagation();

    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      this.showAlert('請先登入', '登入後才能把歌曲加入播放清單。', 'warning');
      return;
    }

    const playlistUsers = await firstValueFrom(
      this.api.getPlaylistUsersByUserId(currentUser.id.toString()),
    );

    if (playlistUsers.length === 0) {
      this.showAlert('沒有可加入的播放清單', '請先建立播放清單後再加入歌曲。', 'info');
      return;
    }

    const result = await Swal.fire({
      title: '加入播放清單',
      input: 'select',
      inputOptions: this.buildPlaylistOptions(playlistUsers),
      inputPlaceholder: '選擇播放清單',
      showCancelButton: true,
      confirmButtonText: '加入',
      cancelButtonText: '取消',
      showLoaderOnConfirm: true,
      inputValidator: (value) => (!value ? '請選擇一個播放清單' : null),
      preConfirm: async (value) => this.addSongToSelectedPlaylist(Number(value), songId),
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    this.showAlert('加入成功', '歌曲已加入播放清單。', 'success', 1200);
    this.refreshCurrentPlaylistIfNeeded(result.value);
  }

  public isFavorite(songId: number): boolean {
    return this.favoriteSongIds().has(songId);
  }

  public async addToFavorite(songId: number, $event: MouseEvent): Promise<void> {
    $event.stopPropagation();

    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      this.showAlert('請先登入', '登入後才能把歌曲加入最愛。', 'warning');
      return;
    }

    await this.favoritePlaylist.addSongToFavorite(currentUser.id, songId);
    this.favoriteSongIds.update((ids) => new Set(ids).add(songId));
  }

  private buildPlaylistOptions(playlistUsers: { playlist: { id: number; name: string } }[]) {
    return playlistUsers.reduce<Record<string, string>>((options, item) => {
      options[item.playlist.id] = item.playlist.name;
      return options;
    }, {});
  }

  private async addSongToSelectedPlaylist(playlistId: number, songId: number): Promise<number | false> {
    const playlistSongs = await firstValueFrom(this.api.getAllSongByPlaylistId(playlistId.toString()));

    if (playlistSongs.some((item) => item.songId === songId)) {
      Swal.showValidationMessage('這首歌已經在此播放清單中');
      return false;
    }

    await firstValueFrom(this.api.addSongToPlaylist(playlistId, songId));
    return playlistId;
  }

  private refreshCurrentPlaylistIfNeeded(updatedPlaylistId: number): void {
    const currentPlaylistId = Number(this.currentRouteId);
    if (this.currentRouteType === 'playlist' && currentPlaylistId === updatedPlaylistId) {
      this.getAllSongByPlaylistId(updatedPlaylistId.toString());
    }
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

  private async loadFavoriteSongs(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) {
      this.favoriteSongIds.set(new Set());
      return;
    }

    this.favoriteSongIds.set(await this.favoritePlaylist.getFavoriteSongIds(user.id));
  }

  public deleteSong(id: number | undefined, $event: MouseEvent): void {
    $event.stopPropagation();

    if (id === undefined) {
      return;
    }

    this.confirmAlert('確認', '確定要刪除這首歌嗎？').then((result) => {
      if (result.isConfirmed) {
        this.confirmDelete(id);
      }
    });
  }

  private confirmAlert(title: string, text: string) {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
    });
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

  private confirmDelete(id: number): void {
    this.api.deleteSongFromPlaylist(id).subscribe({
      next: () => {
        this.getAllSongByPlaylistId(this.currentRouteId);
      },
      error: (err) => {
        console.error('刪除歌曲失敗：', err);
      },
    });
  }
}
