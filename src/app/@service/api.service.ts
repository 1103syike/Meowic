import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  //////////////////////////////////////////////////////
  private http: HttpClient = inject(HttpClient);
  //////////////////////////////////////////////////////

  getAllAlbum(): Observable<AlbumType[]> {
    return this.http.get<AlbumType[]>('http://localhost:3000/albums?_expand=artist');
  }

  getAlbumByAlbumId(id: string): Observable<AlbumType[]> {
    const params = { id: id };
    return this.http.get<AlbumType[]>('http://localhost:3000/albums?_expand=artist', { params });
  }

  getAllSongByAlbumId(id: string): Observable<SongType[]> {
    const params = { 'albumId': id };
    return this.http.get<SongType[]>('http://localhost:3000/songs?_expand=album&_expand=artist', { params });
  }

  getSongById(id: string): Observable<SongType[]> {
    const params = { id: id };
    return this.http.get<SongType[]>('http://localhost:3000/songs?_expand=album&_expand=artist', { params });
  }
}

export interface SongType {
  id: number;
  imgPath?: string;
  name: string;
  artist: ArtistType;
  album: AlbumType;
  length: string;
  like: number;
  audioPath:string
}
interface WithAlbum {
  albumId: number;
  name: string;
  imgPath: string;
}

export interface AlbumType {
  id: number;
  imgPath: string;
  type: string;
  name: string;
  engname: string;
  artist: ArtistType;
  like: number;
}

export interface ArtistType {
  id: number;
  imgPath: string;
  name: string;
  description: string;
}
