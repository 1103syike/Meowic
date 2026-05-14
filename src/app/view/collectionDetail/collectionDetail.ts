import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, AlbumType, SongType, PlaylistUsersType } from '../../@service/api.service';
import { MusicPlayerService } from '../../@service/music-player.service';
export interface PeriodicElement {
  name: string;
  id: number;
  album: string;
  time: string;
  artist: string;
  img: string;
}

@Component({
  selector: 'app-album',
  imports: [MatIconModule, MatTableModule, RouterLink],
  templateUrl: './collectionDetail.html',
  styleUrl: './collectionDetail.scss',
})
export class CollectionDetailComponent {
  ///////////////////////////////////////////////////////
  private route: ActivatedRoute = inject(ActivatedRoute);
  private api: ApiService = inject(ApiService);
  private music: MusicPlayerService = inject(MusicPlayerService);
  ///////////////////////////////////////////////////////
  public displayedColumns: string[] = ['id', 'name', 'album', 'time', 'tool'];
  public songlist = signal<SongType[] | null>(null);
  public currentAlbum = signal<AlbumType | null>(null);
  ///////////////////////////////////////////////////////

  ngOnInit() {
    const type = this.route.snapshot.url[0].path;
    if (type === 'album') {
      this.route.paramMap.subscribe((data) => {
        const albumId = data.get('id') as string;
        this.getAlbumByAlbumId(albumId);
        this.getAllSongByAlbumId(albumId);
      });
    } else if (type === 'playlist') {
      this.route.paramMap.subscribe((data) => {
        const playlistId = data.get('id') as string;
        this.getAllSongByPlaylistId(playlistId);
      });
    }
  }

  private getAllSongByPlaylistId(playlistId: string) {
    this.api.getAllSongByPlaylistId(playlistId).subscribe({
      next: (res: PlaylistUsersType[]) => {
        console.log(res);
      },
    });
  }
  private getAlbumByAlbumId(albumId: string) {
    this.api.getAlbumByAlbumId(albumId).subscribe({
      next: (res: AlbumType[]) => {
        this.currentAlbum.set(res[0]);

        console.log('專輯是：', res[0]);
      },
      error: (err) => {},
    });
  }
  private getAllSongByAlbumId(albumId: string) {
    this.api.getAllSongByAlbumId(albumId).subscribe({
      next: (res: SongType[]) => {
        this.songlist.set(res);

        res.forEach((song) => {
          const audio = new Audio(song.audioPath);

          audio.onloadedmetadata = () => {
            song.length = this.formatTime(audio.duration);
            this.songlist.set([...res]);
          };

          audio.onerror = () => {
            song.length = '--:--';
            this.songlist.set([...res]);
          };
        });
      },
    });
  }

  public setPlayer(id: string) {
    this.music.setPlayer(id);
    this.music.setIsClose(false);
  }

  formatTime(time: number): string {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
