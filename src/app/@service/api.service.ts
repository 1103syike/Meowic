import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  //////////////////////////////////////////////////////
  private http: HttpClient = inject(HttpClient);
  //////////////////////////////////////////////////////

  getAllAlbum(): Observable<AlbumType[]> {
    return this.http.get<AlbumType[]>('http://localhost:3000/albums');
  }

  getAlbumByAlbumId(id: string): Observable<AlbumType[]> {
    const params = { id: id };
    return this.http.get<AlbumType[]>('http://localhost:3000/albums', { params });
  }

  getAllSongByAlbumId(id: string): Observable<SongType[]> {
    const params = { 'album.albumId': id };
    return this.http.get<SongType[]>('http://localhost:3000/songs', { params });
  }

  getSongById(id: string): Observable<SongType[]> {
    const params = { id: id };
    return this.http.get<SongType[]>('http://localhost:3000/songs', { params });
  }
}

export interface SongType {
  id: number;
  imgPath: string;
  songTitle: string;
  artist: string;
  album: WithAlbum;
  length: string;
  like: number;
}
interface WithAlbum {
  albumId: number;
  albumName: string;
  albumCover: string;
}

export interface AlbumType {
  id: number;
  coverPath: string;
  type: string;
  name: string;
  engname: string;
  artist: string;
  like: number;
}
