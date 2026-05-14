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
    return this.http.get<AlbumType[]>('http://localhost:3000/albums?_expand=artist', {
      params,
    });
  }

  getAllSongByAlbumId(id: string): Observable<SongType[]> {
    const params = { albumId: id };
    return this.http.get<SongType[]>('http://localhost:3000/songs?_expand=album&_expand=artist', {
      params,
    });
  }

  getSongById(id: string): Observable<SongType[]> {
    const params = { id: id };
    return this.http.get<SongType[]>('http://localhost:3000/songs?_expand=album&_expand=artist', {
      params,
    });
  }

  getPlaylistUsersByUserId(id: string): Observable<PlaylistUsersType[]> {
    const params = { userId: id };
    return this.http.get<PlaylistUsersType[]>(
      'http://localhost:3000/playlistUsers?_expand=user&_expand=playlist',
      {
        params,
      },
    );
  }

  getAllSongByPlaylistId(id: string): Observable<PlaylistUsersType[]> {
    const params = { playlistId: id };
    return this.http.get<PlaylistUsersType[]>('http://localhost:3000/playlistUsers?_expand=song', {
      params,
    });
  }
}

export interface SongType {
  id: number;
  imgPath?: string;
  name: string;
  album: AlbumType;
  artist: ArtistType;
  length: string;
  like: number;
  audioPath: string;
}
export interface AlbumType {
  id: number;
  imgPath: string;
  type: string;
  name: string;
  engname: string;
  artist?: ArtistType;
  like: number;
}

export interface ArtistType {
  id: number;
  imgPath: string;
  name: string;
  description: string;
}

export interface UserType {
  id: number;
  name: string;
}

export interface PlaylistUsersType {
  id: number;
  playlistId: number;
  playlist: PlaylistType;
  userId: number;
  user: UserType;
}

export interface PlaylistType {
  id: number;
  name: string;
  userId: number;
  type: string;
}
