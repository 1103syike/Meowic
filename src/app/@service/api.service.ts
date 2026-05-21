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

  getAllSong(): Observable<SongType[]> {
    return this.http.get<SongType[]>('http://localhost:3000/songs?_expand=album&_expand=artist');
  }

  getAllArtist(): Observable<ArtistType[]> {
    return this.http.get<ArtistType[]>('http://localhost:3000/artists');
  }

  createArtist(name: string): Observable<ArtistType> {
    const body = {
      name,
      imgPath: './mock/unnamed.png',
      description: '',
    };
    return this.http.post<ArtistType>('http://localhost:3000/artists', body);
  }

  updateArtist(id: number, artist: Partial<ArtistType>): Observable<ArtistType> {
    return this.http.patch<ArtistType>(`http://localhost:3000/artists/${id}`, artist);
  }

  createAlbum(name: string, artistId: number, imgPath: string): Observable<AlbumType> {
    const body = {
      name,
      type: 'album',
      artistId,
      imgPath,
      like: 0,
    };
    return this.http.post<AlbumType>('http://localhost:3000/albums', body);
  }

  updateAlbum(id: number, album: Partial<AlbumType>): Observable<AlbumType> {
    return this.http.patch<AlbumType>(`http://localhost:3000/albums/${id}`, album);
  }

  getPlaylistByPlaylistId(id: string): Observable<AlbumType[]> {
    const params = { id: id };
    return this.http.get<AlbumType[]>('http://localhost:3000/playlists?_expand=user', {
      params,
    });
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

  createPlaylist(name: string, userId: number, type = 'playlist'): Observable<PlaylistType> {
    const body = {
      name,
      userId,
      type,
    };
    return this.http.post<PlaylistType>('http://localhost:3000/playlists', body);
  }

  createPlaylistUser(playlistId: number, userId: number): Observable<PlaylistUsersType> {
    const body = {
      playlistId,
      userId,
    };
    return this.http.post<PlaylistUsersType>('http://localhost:3000/playlistUsers', body);
  }

  getAllSongByPlaylistId(id: string): Observable<PlaylistSongType[]> {
    const params = { playlistId: id };
    return this.http.get<PlaylistSongType[]>('http://localhost:3000/playlistSongs?_expand=song', {
      params,
    });
  }

  addSongToPlaylist(playlistId: number, songId: number): Observable<PlaylistSongType> {
    const body = {
      playlistId: playlistId,
      songId: songId,
    };
    return this.http.post<PlaylistSongType>('http://localhost:3000/playlistSongs', body);
  }

  createSong(song: CreateSongType): Observable<SongType> {
    return this.http.post<SongType>('http://localhost:3000/songs', song);
  }

  updateSong(id: number, song: Partial<CreateSongType>): Observable<SongType> {
    return this.http.patch<SongType>(`http://localhost:3000/songs/${id}`, song);
  }

  uploadFile(fileName: string, dataUrl: string, fileType: string): Observable<UploadResponse> {
    return this.http.post<UploadResponse>('http://localhost:3000/upload', {
      fileName,
      dataUrl,
      fileType,
    });
  }

  deleteSongFromPlaylist(playlistSongId: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:3000/playlistSongs/${playlistSongId}`);
  }

  deletePlaylist(playlistId: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:3000/playlists/${playlistId}`);
  }

  deletePlaylistUser(playlistUserId: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:3000/playlistUsers/${playlistUserId}`);
  }
}

export interface CreateSongType {
  name: string;
  artistId: number;
  albumId: number;
  like: number;
  audioPath: string;
  imgPath?: string;
}

export interface UploadResponse {
  path: string;
}

export interface SongType {
  id: number;
  playlistSongId?: number;
  imgPath?: string;
  artistId?: number;
  albumId?: number;
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
  artistId?: number;
  engname?: string;
  artist?: ArtistType;
  user?: UserType;
  like?: number;
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

export interface PlaylistSongType {
  id: number;
  playlistId: number;
  songId: number;
  song: SongType;
}
