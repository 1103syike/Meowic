import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AlbumType, ApiService, ArtistType, SongPlayType, SongType } from '../../@service/api.service';
import { SearchStateService } from '../../@service/search-state.service';
import { SongList } from '../../component/song-list/song-list';

@Component({
  selector: 'app-artist-page',
  imports: [MatIconModule, RouterLink, SongList],
  templateUrl: './artist.html',
  styleUrl: './artist.scss',
})
export class Artist {
  private api: ApiService = inject(ApiService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private searchState: SearchStateService = inject(SearchStateService);

  public artist = signal<ArtistType | null>(null);
  public albums = signal<AlbumType[]>([]);
  public songs = signal<SongType[]>([]);
  public songPlays = signal<SongPlayType[]>([]);

  public topSongs = computed(() => {
    const counts = new Map<number, number>();
    this.songPlays().forEach((play) => counts.set(play.songId, (counts.get(play.songId) ?? 0) + 1));

    return [...this.songs()]
      .sort((a, b) => {
        const aPlays = counts.get(a.id) ?? a.playCount ?? 0;
        const bPlays = counts.get(b.id) ?? b.playCount ?? 0;
        return bPlays - aPlays || a.name.localeCompare(b.name);
      })
      .slice(0, 10);
  });

  public totalPlays = computed(() => {
    const playRows = this.songPlays();
    if (playRows.length > 0) {
      const songIds = new Set(this.songs().map((song) => song.id));
      return playRows.filter((play) => songIds.has(play.songId)).length;
    }

    return this.songs().reduce((total, song) => total + (song.playCount ?? 0), 0);
  });

  ngOnInit(): void {
    this.searchState.closeSearch();

    this.route.paramMap.subscribe((params) => {
      const artistId = params.get('id');
      if (!artistId) {
        return;
      }

      this.loadArtistPage(artistId);
    });
  }

  public goBack(): void {
    this.router.navigateByUrl('/');
  }

  private async loadArtistPage(artistId: string): Promise<void> {
    const [artist, albums, songs, plays] = await Promise.all([
      firstValueFrom(this.api.getArtistByArtistId(artistId)),
      firstValueFrom(this.api.getAllAlbumByArtistId(artistId)),
      firstValueFrom(this.api.getAllSongByArtistId(artistId)),
      firstValueFrom(this.api.getAllSongPlays()).catch((err) => {
        console.error('載入播放紀錄失敗', err);
        return [];
      }),
    ]);

    this.artist.set(artist[0] ?? null);
    this.albums.set(albums);
    this.songs.set(songs);
    this.songPlays.set(plays);
  }
}
