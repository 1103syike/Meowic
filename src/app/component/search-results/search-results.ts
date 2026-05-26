import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {
  AlbumType,
  ApiService,
  ArtistType,
  availabilityMessage,
  isCatalogItemPlayable,
  isSongPlayable,
  releaseTypeLabel,
  SongType,
} from '../../@service/api.service';
import { MusicPlayerService } from '../../@service/music-player.service';
import { NavigationContextService } from '../../@service/navigation-context.service';
import { PlaybackQueueService } from '../../@service/playback-queue.service';
import { SearchStateService } from '../../@service/search-state.service';

interface ArtistResult {
  type: 'artist';
  id: number;
  artist: ArtistType;
}

interface AlbumResult {
  type: 'album';
  id: number;
  album: AlbumType;
}

interface SongResult {
  type: 'song';
  id: number;
  song: SongType;
}

type SearchResult = ArtistResult | AlbumResult | SongResult;

@Component({
  selector: 'app-search-results',
  imports: [MatIconModule, RouterLink],
  templateUrl: './search-results.html',
  styleUrl: './search-results.scss',
})
export class SearchResults {
  private api: ApiService = inject(ApiService);
  private music: MusicPlayerService = inject(MusicPlayerService);
  private navigationContext: NavigationContextService = inject(NavigationContextService);
  private playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  private router: Router = inject(Router);
  public searchState: SearchStateService = inject(SearchStateService);

  public albums = signal<AlbumType[]>([]);
  public artists = signal<ArtistType[]>([]);
  public songs = signal<SongType[]>([]);

  public matchedSongs = computed(() => {
    const keyword = this.normalizedQuery();

    if (!keyword) {
      return [];
    }

    return this.songs()
      .filter((song) => {
        const fields = [song.name, song.artist?.name, song.album?.name];
        return fields.some((field) => this.normalize(field).includes(keyword));
      })
      .slice(0, 20);
  });

  public matchedArtists = computed(() => {
    const keyword = this.normalizedQuery();

    if (!keyword) {
      return [];
    }

    return this.artists()
      .filter((artist) => this.isStrongArtistMatch(artist.name, keyword))
      .slice(0, 3);
  });

  public matchedAlbums = computed(() => {
    const keyword = this.normalizedQuery();

    if (!keyword) {
      return [];
    }

    return this.albums()
      .filter((album) => {
        const fields = [album.name, album.artist?.name];
        return fields.some((field) => this.normalize(field).includes(keyword));
      })
      .slice(0, 6);
  });

  public results = computed<SearchResult[]>(() => [
    ...this.matchedArtists().map((artist) => ({ type: 'artist' as const, id: artist.id, artist })),
    ...this.matchedAlbums().map((album) => ({ type: 'album' as const, id: album.id, album })),
    ...this.matchedSongs().map((song) => ({ type: 'song' as const, id: song.id, song })),
  ]);

  public hasQuery = computed(() => this.normalizedQuery().length > 0);

  ngOnInit(): void {
    this.api.getAllArtist().subscribe({
      next: (artists) => this.artists.set(artists),
      error: (err) => console.error('載入藝人失敗', err),
    });

    this.api.getAllAlbum().subscribe({
      next: (albums) => this.albums.set(albums.filter((album) => album.type !== 'playlist')),
      error: (err) => console.error('載入發行作品失敗', err),
    });

    this.api.getAllSong().subscribe({
      next: (songs) => this.songs.set(songs),
      error: (err) => console.error('載入歌曲失敗', err),
    });
  }

  public playSong(song: SongType): void {
    if (!isSongPlayable(song)) {
      Swal.fire('尚未開放', `此歌曲或發行作品${availabilityMessage(song)}，目前還不能播放。`, 'info');
      return;
    }

    const songs = this.matchedSongs();
    this.playbackQueue.setQueue(
      {
        title: '搜尋結果',
        source: 'search',
        songs: [song],
        autoSongs: songs.filter((item) => item.id !== song.id),
        recommendationPool: songs,
      },
      song.id,
    );
    this.music.setPlayer(song.id.toString());
    this.music.setIsClose(false);
    this.navigationContext.setSongBackUrl(this.router.url);
    this.searchState.closeSearch();
    this.router.navigate(['/song', song.id]);
  }

  public songImage(song: SongType): string {
    return song.imgPath || song.album?.imgPath || './mock/unnamed.png';
  }

  public artistSongCount(artistId: number): number {
    return this.songs().filter((song) => song.artistId === artistId).length;
  }

  public albumSongCount(albumId: number): number {
    return this.songs().filter((song) => (song.albumId ?? song.album?.id) === albumId).length;
  }

  public albumStatus(album: AlbumType): string {
    return availabilityMessage(album);
  }

  public releaseLabel(album: AlbumType): string {
    return releaseTypeLabel(album.type);
  }

  public songStatus(song: SongType): string {
    return availabilityMessage(song);
  }

  public shouldShowAlbumNotice(album: AlbumType): boolean {
    return !isCatalogItemPlayable(album);
  }

  public shouldShowSongNotice(song: SongType): boolean {
    return !isSongPlayable(song);
  }

  private normalizedQuery(): string {
    return this.normalize(this.searchState.query());
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private isStrongArtistMatch(name: string, keyword: string): boolean {
    const artistName = this.normalize(name);

    return (
      artistName === keyword ||
      artistName.startsWith(keyword) ||
      (keyword.length >= 4 && artistName.includes(keyword))
    );
  }
}
