import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../@service/auth.service';
import { Login } from '../login/login';
import { MusicPlayerService } from '../../@service/music-player.service';
import { Router, RouterLink } from '@angular/router';
import { ApiService, PlaylistUsersType, UserType } from '../../@service/api.service';

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
  private player: MusicPlayerService = inject(MusicPlayerService);
  private router: Router = inject(Router);
  /////////////////////////////////////////////
  public isLoginDialogOpen = signal(false);
  public ownedPlaylist = signal<PlaylistUsersType[]>([]);

  openLoginDialog() {
    this.isLoginDialogOpen.set(true);
  }
  ngOnInit() {

    if (this.auth.isLoggedIn()) {
      this.auth.getUserInfo()?.subscribe((res: UserType[]) => {

        this.api.getPlaylistUsersByUserId(`${res[0].id}`).subscribe((res) => {
          console.log(res);

          this.ownedPlaylist.set(res);
        });
      });
    }
  }
}
