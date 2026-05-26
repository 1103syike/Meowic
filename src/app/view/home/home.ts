import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import {
  AlbumType,
  ApiService,
  ArtistType,
  availabilityMessage,
  isCatalogItemPlayable,
  isSongPlayable,
  SongPlayType,
  SongType,
} from '../../@service/api.service';
import { MusicPlayerService } from '../../@service/music-player.service';
import { NavigationContextService } from '../../@service/navigation-context.service';
import { PlaybackQueueService } from '../../@service/playback-queue.service';
import { SearchStateService } from '../../@service/search-state.service';
import { SearchResults } from '../../component/search-results/search-results';
import { HomeAds } from './ads/home-ads';

type RankedSong = SongType & { weeklyPlayCount: number; weeklyListenedSeconds: number };
type RankedArtist = ArtistType & { weeklyPlayCount: number; weeklyListenedSeconds: number };
type RankedAlbum = AlbumType & { weeklyPlayCount: number; weeklyListenedSeconds: number };

const editorialLimits = {
  songs: 6,
  artists: 8,
  albums: 8,
};

@Component({
  selector: 'app-home',
  imports: [HomeAds, RouterLink, SearchResults],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private api: ApiService = inject(ApiService);
  private music: MusicPlayerService = inject(MusicPlayerService);
  private navigationContext: NavigationContextService = inject(NavigationContextService);
  private playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  private router: Router = inject(Router);
  public searchState: SearchStateService = inject(SearchStateService);

  public songs = signal<SongType[]>([]);
  public artists = signal<ArtistType[]>([]);
  public albums = signal<AlbumType[]>([]);
  public plays = signal<SongPlayType[]>([]);
  public editorialSongIds = signal<number[]>([]);
  public editorialArtistIds = signal<number[]>([]);
  public editorialAlbumIds = signal<number[]>([]);

  public weeklySongs = computed<RankedSong[]>(() =>
    this.rankSongsByWeeklyPlays(this.songs(), this.weeklyPlays()).slice(0, 12),
  );
  public weeklyArtists = computed<RankedArtist[]>(() =>
    this.rankArtistsByWeeklyPlays(this.artists(), this.songs(), this.weeklyPlays()).slice(0, 6),
  );
  public weeklyAlbums = computed<RankedAlbum[]>(() =>
    this.rankAlbumsByWeeklyPlays(this.albums(), this.songs(), this.weeklyPlays()).slice(0, 6),
  );
  public editorialSongs = computed<SongType[]>(() =>
    this.editorialSongIds()
      .map((id) => this.songs().find((song) => song.id === id))
      .filter((song): song is SongType => !!song)
      .slice(0, editorialLimits.songs),
  );
  public editorialArtists = computed<ArtistType[]>(() =>
    this.editorialArtistIds()
      .map((id) => this.artists().find((artist) => artist.id === id))
      .filter((artist): artist is ArtistType => !!artist)
      .slice(0, editorialLimits.artists),
  );
  public editorialAlbums = computed<AlbumType[]>(() =>
    this.editorialAlbumIds()
      .map((id) => this.albums().find((album) => album.id === id))
      .filter((album): album is AlbumType => !!album)
      .slice(0, editorialLimits.albums),
  );
  public latestAlbums = computed(() =>
    [...this.albums()]
      .filter((album) => album.type !== 'playlist' && isCatalogItemPlayable(album))
      .sort((a, b) => this.dateScore(b.availableAt || b.uploadedAt || b.releaseDate) - this.dateScore(a.availableAt || a.uploadedAt || a.releaseDate))
      .slice(0, 5),
  );

  ngOnInit(): void {
    this.loadHome();
  }

  public async playSong(song: SongType): Promise<void> {
    if (!isSongPlayable(song)) {
      await Swal.fire('尚未開放播放', availabilityMessage(song), 'info');
      return;
    }

    const songs = this.weeklySongs().length ? this.weeklySongs() : this.songs().slice(0, 8);
    this.playbackQueue.setQueue(
      {
        title: '近七天熱門歌曲',
        source: 'temporary',
        songs: [song],
        autoSongs: songs.filter((item) => item.id !== song.id),
        recommendationPool: songs,
      },
      song.id,
    );
    this.music.setPlayer(song.id.toString());
    this.music.setIsClose(false);
    this.navigationContext.setSongBackUrl('/');
    this.searchState.closeSearch();
    this.router.navigate(['/song', song.id]);
  }

  public scrollShelf(container: HTMLElement, direction: -1 | 1): void {
    container.scrollBy({
      left: direction * Math.round(container.clientWidth * 0.82),
      behavior: 'smooth',
    });
  }

  private async loadHome(): Promise<void> {
    const [songs, artists, albums, plays, recommendations] = await Promise.all([
      firstValueFrom(this.api.getAllSong()),
      firstValueFrom(this.api.getAllArtist()),
      firstValueFrom(this.api.getAllAlbum()),
      firstValueFrom(this.api.getAllSongPlays()),
      firstValueFrom(this.api.getHomeRecommendations()),
    ]);

    this.songs.set(songs);
    this.artists.set(artists);
    this.albums.set(albums);
    this.plays.set(plays);
    this.editorialSongIds.set(recommendations[0]?.popularSongIds ?? []);
    this.editorialArtistIds.set(recommendations[0]?.popularArtistIds ?? []);
    this.editorialAlbumIds.set(recommendations[0]?.popularAlbumIds ?? []);
  }

  private weeklyPlays(): SongPlayType[] {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.plays().filter((play) => new Date(play.playedAt).getTime() >= sevenDaysAgo);
  }

  private rankSongsByWeeklyPlays(songs: SongType[], plays: SongPlayType[]): RankedSong[] {
    const stats = this.getSongStats(plays);
    return songs
      .filter(isSongPlayable)
      .map((song) => ({
        ...song,
        weeklyPlayCount: stats.get(song.id)?.plays ?? 0,
        weeklyListenedSeconds: stats.get(song.id)?.seconds ?? 0,
      }))
      .filter((song) => song.weeklyPlayCount > 0)
      .sort((a, b) => b.weeklyPlayCount - a.weeklyPlayCount || b.weeklyListenedSeconds - a.weeklyListenedSeconds);
  }

  private rankArtistsByWeeklyPlays(artists: ArtistType[], songs: SongType[], plays: SongPlayType[]): RankedArtist[] {
    const songById = new Map(songs.map((song) => [song.id, song]));
    const stats = new Map<number, { plays: number; seconds: number }>();
    plays.forEach((play) => {
      const artistId = songById.get(play.songId)?.artistId;
      if (!artistId) return;
      const current = stats.get(artistId) ?? { plays: 0, seconds: 0 };
      stats.set(artistId, {
        plays: current.plays + 1,
        seconds: current.seconds + (play.listenedSeconds || 0),
      });
    });

    return artists
      .map((artist) => ({
        ...artist,
        weeklyPlayCount: stats.get(artist.id)?.plays ?? 0,
        weeklyListenedSeconds: stats.get(artist.id)?.seconds ?? 0,
      }))
      .filter((artist) => artist.weeklyPlayCount > 0)
      .sort((a, b) => b.weeklyPlayCount - a.weeklyPlayCount || b.weeklyListenedSeconds - a.weeklyListenedSeconds);
  }

  private rankAlbumsByWeeklyPlays(albums: AlbumType[], songs: SongType[], plays: SongPlayType[]): RankedAlbum[] {
    const songById = new Map(songs.map((song) => [song.id, song]));
    const stats = new Map<number, { plays: number; seconds: number }>();
    plays.forEach((play) => {
      const albumId = songById.get(play.songId)?.albumId;
      if (!albumId) return;
      const current = stats.get(albumId) ?? { plays: 0, seconds: 0 };
      stats.set(albumId, {
        plays: current.plays + 1,
        seconds: current.seconds + (play.listenedSeconds || 0),
      });
    });

    return albums
      .filter((album) => album.type !== 'playlist' && isCatalogItemPlayable(album))
      .map((album) => ({
        ...album,
        weeklyPlayCount: stats.get(album.id)?.plays ?? 0,
        weeklyListenedSeconds: stats.get(album.id)?.seconds ?? 0,
      }))
      .filter((album) => album.weeklyPlayCount > 0)
      .sort((a, b) => b.weeklyPlayCount - a.weeklyPlayCount || b.weeklyListenedSeconds - a.weeklyListenedSeconds);
  }

  private getSongStats(plays: SongPlayType[]): Map<number, { plays: number; seconds: number }> {
    const stats = new Map<number, { plays: number; seconds: number }>();
    plays.forEach((play) => {
      const current = stats.get(play.songId) ?? { plays: 0, seconds: 0 };
      stats.set(play.songId, {
        plays: current.plays + 1,
        seconds: current.seconds + (play.listenedSeconds || 0),
      });
    });
    return stats;
  }

  private dateScore(value: string | null | undefined): number {
    if (!value) return 0;
    const date = new Date(value).getTime();
    return Number.isNaN(date) ? 0 : date;
  }
}
