import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, AlbumType, SongType } from '../../@service/api.service';
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
  templateUrl: './album.html',
  styleUrl: './album.scss',
})
export class Album {
  ///////////////////////////////////////////////////////
  private route: ActivatedRoute = inject(ActivatedRoute);
  private api: ApiService = inject(ApiService);
  private music:MusicPlayerService = inject(MusicPlayerService)
  ///////////////////////////////////////////////////////
  public displayedColumns: string[] = ['id', 'name', 'album', 'time', 'tool'];
  public songlist = signal<SongType[] | null>(null);
  public currentAlbum = signal<AlbumType | null>(null);
  ///////////////////////////////////////////////////////

  ngOnInit() {
    this.route.paramMap.subscribe((data) => {
      const albumId = data.get('id') as string;
      this.getAlbumByAlbumId(albumId);
      this.getAllSongByAlbumId(albumId);
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
        console.log('歌曲列表是：', res);

        this.songlist.set(res);
      },
      error: (err) => {},
    });
  }

  public setPlayer(id:string){
    this.music.setPlayer(id)
    this.music.setIsClose(false)
  }
}
