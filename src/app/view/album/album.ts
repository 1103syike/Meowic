import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService, AlbumType, Song } from '../../@service/api.service';
export interface PeriodicElement {
  name: string;
  id: number;
  album: string;
  time: string;
  artist: string;
  img: string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {
    id: 1,
    img: './mock/album/img-1.png',
    name: '午夜霓虹',
    artist: '林曉風',
    album: '城市漫遊',
    time: '3:42',
  },
  {
    id: 2,
    img: './mock/album/img-11.png',
    name: '破碎的時光機',
    artist: '陳語嫣',
    album: '維度跳躍',
    time: '4:15',
  },
  {
    id: 3,
    img: './mock/album/img-3.png',
    name: '深海呼吸',
    artist: '海浪樂團',
    album: '蔚藍色',
    time: '5:08',
  },
  {
    id: 4,
    img: './mock/album/img-4.png',
    name: '數位荒野',
    artist: 'Zero One',
    album: '代碼之詩',
    time: '2:56',
  },
  {
    id: 5,
    img: './mock/album/img-5.png',
    name: '最後一封信',
    artist: '李慕凡',
    album: '紙飛機',
    time: '4:33',
  },
  {
    id: 6,
    img: './mock/album/img-6.png',
    name: '宇宙塵埃',
    artist: '星際旅者',
    album: '銀河系導覽',
    time: '3:20',
  },
  {
    id: 7,
    img: './mock/album/img-7.png',
    name: '微光邊緣',
    artist: '夏日幻境',
    album: '白日夢',
    time: '4:47',
  },
  {
    id: 8,
    img: './mock/album/img-8.png',
    name: '雨後的咖啡館',
    artist: '張小雨',
    album: '日常片段',
    time: '3:12',
  },
  {
    id: 9,
    img: './mock/album/img-9.png',
    name: '無名高地',
    artist: '赤色信號',
    album: '搖滾魂',
    time: '5:24',
  },
  {
    id: 10,
    img: './mock/album/img-10.png',
    name: '冬眠覺醒',
    artist: '北國少女',
    album: '初雪',
    time: '4:01',
  },
];
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
  ///////////////////////////////////////////////////////
  displayedColumns: string[] = ['id', 'name', 'album', 'time', 'tool'];
  public songlist = signal<Song[] | null>(null);
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
      },
      error: (err) => {},
    });
  }
  private getAllSongByAlbumId(albumId: string) {
    this.api.getAllSongByAlbumId(albumId).subscribe({
      next: (res: Song[]) => {
        this.songlist.set(res);
      },
      error: (err) => {},
    });
  }
}
