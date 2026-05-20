import { Component, effect, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../@service/auth.service';
import { Login } from '../login/login';
import { Router, RouterLink } from '@angular/router';
import { ApiService, PlaylistUsersType, UserType } from '../../@service/api.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { FavoritePlaylistService } from '../../@service/favorite-playlist.service';

@Component({
  selector: 'app-playlist-bar',
  imports: [MatIconModule, Login, RouterLink],
  templateUrl: './playlist-bar.html',
  styleUrl: './playlist-bar.scss',
  host: {
    class: 'playlist-bar', //
  },
})
export class PlaylistBar {
  public auth: AuthService = inject(AuthService);
  public api: ApiService = inject(ApiService);
  private router: Router = inject(Router);
  private favoritePlaylist: FavoritePlaylistService = inject(FavoritePlaylistService);
  /////////////////////////////////////////////
  public isLoginDialogOpen = signal(false);
  public ownedPlaylists = signal<PlaylistUsersType[] | null>([]);
  constructor() {
    effect(() => {
      const loginStatus = this.auth.currentUserStatus();
      this.loadOwnedPlaylists(loginStatus);
    });
  }
  openLoginDialog() {
    this.isLoginDialogOpen.set(true);
  }

  public async createPlaylist(): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      this.openLoginDialog();
      return;
    }

    const result = await Swal.fire({
      title: '新增播放清單',
      input: 'text',
      inputLabel: '播放清單名稱',
      inputPlaceholder: '輸入播放清單名稱',
      showCancelButton: true,
      confirmButtonText: '新增',
      cancelButtonText: '取消',
      inputValidator: (value) => {
        if (!value.trim()) {
          return '請輸入播放清單名稱';
        }
        return null;
      },
      preConfirm: async (value) => {
        const playlist = await firstValueFrom(
          this.api.createPlaylist(value.trim(), currentUser.id),
        );
        await firstValueFrom(this.api.createPlaylistUser(playlist.id, currentUser.id));
        return playlist;
      },
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (!result.isConfirmed) {
      return;
    }

    this.loadOwnedPlaylists(true);
    Swal.fire({
      title: '新增成功',
      text: '播放清單已建立。',
      icon: 'success',
      timer: 1200,
      showConfirmButton: false,
    });
  }

  public async deletePlaylist(event: MouseEvent, playlistUser: PlaylistUsersType): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    if (playlistUser.playlist.type === 'favorite') {
      Swal.fire({
        title: '無法刪除',
        text: '喜歡的歌曲是系統預設播放清單，會一直保留。',
        icon: 'info',
        timer: 1400,
        showConfirmButton: false,
      });
      return;
    }

    const result = await Swal.fire({
      title: '刪除播放清單？',
      text: `「${playlistUser.playlist.name}」會從音樂庫移除，清單內的歌曲不會被刪除。`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
      confirmButtonColor: '#74a57f',
    });

    if (!result.isConfirmed) {
      return;
    }

    const playlistSongs = await firstValueFrom(
      this.api.getAllSongByPlaylistId(playlistUser.playlist.id.toString()),
    );

    await Promise.all(
      playlistSongs.map((playlistSong) =>
        firstValueFrom(this.api.deleteSongFromPlaylist(playlistSong.id)),
      ),
    );
    await firstValueFrom(this.api.deletePlaylistUser(playlistUser.id));
    await firstValueFrom(this.api.deletePlaylist(playlistUser.playlist.id));

    this.ownedPlaylists.update((playlists) =>
      playlists?.filter((item) => item.id !== playlistUser.id) ?? null,
    );

    if (this.router.url === `/playlist/${playlistUser.playlist.id}`) {
      await this.router.navigate(['/']);
    }

    Swal.fire({
      title: '已刪除',
      text: '播放清單已從音樂庫移除。',
      icon: 'success',
      timer: 1200,
      showConfirmButton: false,
    });
  }

  private loadOwnedPlaylists(isLogin: boolean) {
    if (isLogin) {
      this.loadCurrentUserPlaylists();
    } else {
      this.ownedPlaylists.set(null);
    }
  }

  private async loadCurrentUserPlaylists(): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) {
      this.ownedPlaylists.set(null);
      return;
    }

    await this.favoritePlaylist.ensureFavoritePlaylist(user.id);
    const playlists = await firstValueFrom(this.api.getPlaylistUsersByUserId(user.id.toString()));
    this.ownedPlaylists.set(this.sortPlaylists(this.removeDuplicateFavoritePlaylists(playlists)));
  }

  private sortPlaylists(playlists: PlaylistUsersType[]): PlaylistUsersType[] {
    return [...playlists].sort((a, b) => {
      if (a.playlist.type === 'favorite') {
        return -1;
      }

      if (b.playlist.type === 'favorite') {
        return 1;
      }

      return a.id - b.id;
    });
  }

  private removeDuplicateFavoritePlaylists(playlists: PlaylistUsersType[]): PlaylistUsersType[] {
    let hasFavoritePlaylist = false;

    return [...playlists]
      .sort((a, b) => a.playlist.id - b.playlist.id)
      .filter((playlistUser) => {
        if (playlistUser.playlist.type !== 'favorite') {
          return true;
        }

        if (hasFavoritePlaylist) {
          return false;
        }

        hasFavoritePlaylist = true;
        return true;
      });
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
}
