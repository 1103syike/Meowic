import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, firstValueFrom, of } from 'rxjs';
import {
  AlbumType,
  ApiService,
  ArtistType,
  HomeRecommendationType,
  SongPlayType,
  SongType,
  UserType,
} from '../../../@service/api.service';

@Component({
  selector: 'app-cms-dashboard',
  imports: [RouterLink],
  templateUrl: './cms-dashboard.html',
  styleUrl: './cms-dashboard.scss',
})
export class CmsDashboard {
  private api: ApiService = inject(ApiService);

  public songs = signal<SongType[]>([]);
  public albums = signal<AlbumType[]>([]);
  public artists = signal<ArtistType[]>([]);
  public users = signal<UserType[]>([]);
  public plays = signal<SongPlayType[]>([]);
  public recommendations = signal<HomeRecommendationType | null>(null);
  public isLoading = signal(true);

  public albumCount = computed(() => this.albums().filter((album) => album.type !== 'playlist').length);
  public totalPlays = computed(() =>
    this.songs().reduce((total, song) => total + (Number(song.playCount) || 0), 0),
  );
  public recommendedSongCount = computed(() => this.recommendations()?.popularSongIds?.length ?? 0);
  public recommendedArtistCount = computed(() => this.recommendations()?.popularArtistIds?.length ?? 0);
  public songsMissingCover = computed(
    () => this.songs().filter((song) => !song.imgPath && !song.album?.imgPath).length,
  );
  public artistsMissingDescription = computed(
    () => this.artists().filter((artist) => !artist.description?.trim()).length,
  );
  public albumsWithoutSongs = computed(() =>
    this.albums().filter(
      (album) =>
        album.type !== 'playlist' &&
        !this.songs().some((song) => (song.albumId ?? song.album?.id) === album.id),
    ).length,
  );
  public topSongs = computed(() =>
    [...this.songs()]
      .sort((a, b) => (Number(b.playCount) || 0) - (Number(a.playCount) || 0))
      .slice(0, 5),
  );
  public latestSongs = computed(() => [...this.songs()].sort((a, b) => b.id - a.id).slice(0, 5));
  public latestPlay = computed(() =>
    [...this.plays()].sort((a, b) => Date.parse(b.playedAt) - Date.parse(a.playedAt))[0],
  );

  ngOnInit() {
    this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.isLoading.set(true);

    try {
      const [songs, albums, artists, users, plays, recommendations] = await Promise.all([
        firstValueFrom(this.api.getAllSong()),
        firstValueFrom(this.api.getAllAlbum()),
        firstValueFrom(this.api.getAllArtist()),
        firstValueFrom(this.api.getAllUsers()),
        firstValueFrom(this.api.getAllSongPlays().pipe(catchError(() => of([])))),
        firstValueFrom(this.api.getHomeRecommendations().pipe(catchError(() => of([])))),
      ]);

      this.songs.set(songs);
      this.albums.set(albums);
      this.artists.set(artists);
      this.users.set(users);
      this.plays.set(plays);
      this.recommendations.set(recommendations[0] ?? null);
    } finally {
      this.isLoading.set(false);
    }
  }
}
