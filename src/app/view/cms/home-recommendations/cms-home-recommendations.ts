import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, firstValueFrom, of } from 'rxjs';
import {
  ApiService,
  AlbumType,
  ArtistType,
  HomeRecommendationType,
  SongType,
} from '../../../@service/api.service';
import { getCmsErrorMessage, showCmsError, showCmsSuccess } from '../cms-feedback';

@Component({
  selector: 'app-cms-home-recommendations',
  imports: [FormsModule],
  templateUrl: './cms-home-recommendations.html',
  styleUrl: './cms-home-recommendations.scss',
})
export class CmsHomeRecommendations {
  private api: ApiService = inject(ApiService);
  private readonly selectionLimits = {
    songs: 6,
    artists: 8,
    albums: 8,
  };

  public songs = signal<SongType[]>([]);
  public artists = signal<ArtistType[]>([]);
  public albums = signal<AlbumType[]>([]);
  public recommendation = signal<HomeRecommendationType | null>(null);
  public selectedSongIds = signal<number[]>([]);
  public selectedArtistIds = signal<number[]>([]);
  public selectedAlbumIds = signal<number[]>([]);
  public songKeyword = signal('');
  public artistKeyword = signal('');
  public albumKeyword = signal('');
  public songPage = signal(1);
  public artistPage = signal(1);
  public albumPage = signal(1);
  public readonly pageSize = 6;
  public readonly songLimit = this.selectionLimits.songs;
  public readonly artistLimit = this.selectionLimits.artists;
  public readonly albumLimit = this.selectionLimits.albums;
  public isLoading = signal(true);
  public isSaving = signal(false);
  public message = signal('');

  public filteredSongs = computed(() => {
    const keyword = this.normalizeKeyword(this.songKeyword());
    if (!keyword) return this.songs();

    return this.songs().filter((song) =>
      [song.name, song.artist?.name, song.album?.name].some((value) =>
        this.normalizeKeyword(value ?? '').includes(keyword),
      ),
    );
  });

  public filteredArtists = computed(() => {
    const keyword = this.normalizeKeyword(this.artistKeyword());
    if (!keyword) return this.artists();

    return this.artists().filter((artist) =>
      [artist.name, artist.description].some((value) =>
        this.normalizeKeyword(value ?? '').includes(keyword),
      ),
    );
  });

  public filteredAlbums = computed(() => {
    const keyword = this.normalizeKeyword(this.albumKeyword());
    const albums = this.albums().filter((album) => album.type !== 'playlist');
    if (!keyword) return albums;

    return albums.filter((album) =>
      [album.name, album.artist?.name].some((value) => this.normalizeKeyword(value ?? '').includes(keyword)),
    );
  });

  public pagedSongs = computed(() => this.getPageItems(this.filteredSongs(), this.songPage()));
  public pagedArtists = computed(() => this.getPageItems(this.filteredArtists(), this.artistPage()));
  public pagedAlbums = computed(() => this.getPageItems(this.filteredAlbums(), this.albumPage()));
  public songPageCount = computed(() => this.getPageCount(this.filteredSongs().length));
  public artistPageCount = computed(() => this.getPageCount(this.filteredArtists().length));
  public albumPageCount = computed(() => this.getPageCount(this.filteredAlbums().length));

  public selectedSongs = computed(() =>
    this.selectedSongIds()
      .map((id) => this.songs().find((song) => song.id === id))
      .filter((song): song is SongType => !!song),
  );

  public selectedArtists = computed(() =>
    this.selectedArtistIds()
      .map((id) => this.artists().find((artist) => artist.id === id))
      .filter((artist): artist is ArtistType => !!artist),
  );

  public selectedAlbums = computed(() =>
    this.selectedAlbumIds()
      .map((id) => this.albums().find((album) => album.id === id))
      .filter((album): album is AlbumType => !!album),
  );

  ngOnInit() {
    this.loadData();
  }

  public toggleSong(songId: number): void {
    this.selectedSongIds.update((ids) => this.toggleId(ids, songId, this.selectionLimits.songs, '主打歌曲'));
  }

  public toggleArtist(artistId: number): void {
    this.selectedArtistIds.update((ids) => this.toggleId(ids, artistId, this.selectionLimits.artists, '焦點藝人'));
  }

  public toggleAlbum(albumId: number): void {
    this.selectedAlbumIds.update((ids) => this.toggleId(ids, albumId, this.selectionLimits.albums, '焦點專輯'));
  }

  public isSongSelected(songId: number): boolean {
    return this.selectedSongIds().includes(songId);
  }

  public isArtistSelected(artistId: number): boolean {
    return this.selectedArtistIds().includes(artistId);
  }

  public isAlbumSelected(albumId: number): boolean {
    return this.selectedAlbumIds().includes(albumId);
  }

  public moveSong(songId: number, direction: -1 | 1): void {
    this.selectedSongIds.update((ids) => this.moveId(ids, songId, direction));
  }

  public moveArtist(artistId: number, direction: -1 | 1): void {
    this.selectedArtistIds.update((ids) => this.moveId(ids, artistId, direction));
  }

  public moveAlbum(albumId: number, direction: -1 | 1): void {
    this.selectedAlbumIds.update((ids) => this.moveId(ids, albumId, direction));
  }

  public setSongKeyword(keyword: string): void {
    this.songKeyword.set(keyword);
    this.songPage.set(1);
  }

  public setArtistKeyword(keyword: string): void {
    this.artistKeyword.set(keyword);
    this.artistPage.set(1);
  }

  public setAlbumKeyword(keyword: string): void {
    this.albumKeyword.set(keyword);
    this.albumPage.set(1);
  }

  public changeSongPage(direction: -1 | 1): void {
    this.songPage.update((page) => this.clampPage(page + direction, this.songPageCount()));
  }

  public changeArtistPage(direction: -1 | 1): void {
    this.artistPage.update((page) => this.clampPage(page + direction, this.artistPageCount()));
  }

  public changeAlbumPage(direction: -1 | 1): void {
    this.albumPage.update((page) => this.clampPage(page + direction, this.albumPageCount()));
  }

  public async save(): Promise<void> {
    const payload = {
      popularSongIds: this.selectedSongIds(),
      popularArtistIds: this.selectedArtistIds(),
      popularAlbumIds: this.selectedAlbumIds(),
    };

    this.isSaving.set(true);
    this.message.set('');

    try {
      const recommendation = this.recommendation();
      if (recommendation?.id) {
        await firstValueFrom(this.api.updateHomeRecommendations(recommendation.id, payload));
      } else {
        await firstValueFrom(this.api.createHomeRecommendations(payload));
      }

      await this.loadData();
      this.message.set('首頁精選已更新');
      await showCmsSuccess('首頁精選已更新');
    } catch (err) {
      console.error('CMS 更新首頁推薦失敗：', err);
      const message = getCmsErrorMessage(err, '更新失敗，請確認 API server 已重啟後再試');
      this.message.set(message);
      await showCmsError('更新失敗', message);
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const [songs, artists, albums, recommendations] = await Promise.all([
        firstValueFrom(this.api.getAllSong()),
        firstValueFrom(this.api.getAllArtist()),
        firstValueFrom(this.api.getAllAlbum()),
        firstValueFrom(this.api.getHomeRecommendations().pipe(catchError(() => of([])))),
      ]);
      const recommendation = recommendations[0] ?? null;

      this.songs.set(songs);
      this.artists.set(artists);
      this.albums.set(albums);
      this.recommendation.set(recommendation);
      this.selectedSongIds.set(recommendation?.popularSongIds ?? []);
      this.selectedArtistIds.set(recommendation?.popularArtistIds ?? []);
      this.selectedAlbumIds.set(recommendation?.popularAlbumIds ?? []);
      this.songPage.set(this.clampPage(this.songPage(), this.getPageCount(songs.length)));
      this.artistPage.set(this.clampPage(this.artistPage(), this.getPageCount(artists.length)));
      this.albumPage.set(this.clampPage(this.albumPage(), this.getPageCount(albums.length)));
      this.message.set(recommendation ? '' : '尚未建立首頁精選，請勾選內容後儲存。');
    } catch (err) {
      console.error('CMS 載入首頁推薦資料失敗：', err);
      this.message.set('載入失敗，請確認 API server 是否啟動');
    } finally {
      this.isLoading.set(false);
    }
  }

  private toggleId(ids: number[], id: number, limit: number, label: string): number[] {
    if (ids.includes(id)) {
      return ids.filter((currentId) => currentId !== id);
    }

    if (ids.length >= limit) {
      this.message.set(`${label}最多可選 ${limit} 個，請先移除一個再加入。`);
      return ids;
    }

    this.message.set('');
    return [...ids, id];
  }

  private moveId(ids: number[], id: number, direction: -1 | 1): number[] {
    const index = ids.indexOf(id);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) {
      return ids;
    }

    const nextIds = [...ids];
    [nextIds[index], nextIds[nextIndex]] = [nextIds[nextIndex], nextIds[index]];
    return nextIds;
  }

  private getPageItems<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  }

  private getPageCount(total: number): number {
    return Math.max(1, Math.ceil(total / this.pageSize));
  }

  private clampPage(page: number, pageCount: number): number {
    return Math.min(Math.max(page, 1), pageCount);
  }

  private normalizeKeyword(value: string): string {
    return value.trim().toLowerCase();
  }
}
