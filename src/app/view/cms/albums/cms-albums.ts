import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AlbumType,
  ApiService,
  ArtistType,
  catalogStatusLabel,
  fromDateTimeInputValue,
  getCatalogStatus,
  ReleaseType,
  releaseTypeLabel,
  releaseTypeOptions,
  SongType,
  toDateInputValue,
  toDateTimeInputValue,
} from '../../../@service/api.service';
import { CatalogCmsActions } from '../catalog-cms-actions.service';
import { formatMissingFields, getCmsErrorMessage, showCmsError, showCmsSuccess } from '../cms-feedback';

@Component({
  selector: 'app-cms-albums',
  imports: [FormsModule],
  templateUrl: './cms-albums.html',
  styleUrl: './cms-albums.scss',
})
export class CmsAlbums {
  private api: ApiService = inject(ApiService);
  private catalogActions = inject(CatalogCmsActions);

  public albums = signal<AlbumType[]>([]);
  public artists = signal<ArtistType[]>([]);
  public imagePreview = signal('');
  public songs = signal<SongType[]>([]);
  public selectedAlbum = signal<AlbumType | null>(null);
  public selectedSongId = signal(0);
  public isSaving = signal(false);
  public message = signal('');
  public invalidFields = signal<string[]>([]);
  public keyword = signal('');
  public page = signal(1);
  public readonly pageSize = 6;
  public readonly releaseTypeOptions = releaseTypeOptions;

  public editForm = {
    name: '',
    artistId: 0,
    type: 'album' as ReleaseType,
    releaseDate: '',
    uploadedAt: '',
    availableAt: '',
    unavailableAt: '',
  };

  private imageFile: File | null = null;
  private readonly fieldLabels: Record<string, string> = {
    name: '發行作品名稱',
    artistId: '藝人',
  };

  public selectedAlbumImage = computed(() => {
    const album = this.selectedAlbum();
    return this.imagePreview() || album?.imgPath || './mock/unnamed.png';
  });

  public filteredAlbums = computed(() => {
    const keyword = this.keyword().trim().toLowerCase();
    if (!keyword) return this.albums();
    return this.albums().filter((album) =>
      [album.name, album.artist?.name].some((value) => (value ?? '').toLowerCase().includes(keyword)),
    );
  });

  public pagedAlbums = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredAlbums().slice(start, start + this.pageSize);
  });

  public pageCount = computed(() => Math.max(1, Math.ceil(this.filteredAlbums().length / this.pageSize)));

  public albumSongs = computed(() => {
    const album = this.selectedAlbum();
    if (!album) return [];
    return this.songs().filter((song) => (song.albumId ?? song.album?.id) === album.id);
  });

  public availableSongs = computed(() => {
    const album = this.selectedAlbum();
    if (!album) return [];
    return this.songs().filter((song) => (song.albumId ?? song.album?.id) !== album.id);
  });

  public hasPendingChanges(): boolean {
    const album = this.selectedAlbum();
    if (!album) return false;
    return (
      !!this.imagePreview() ||
      this.editForm.name !== album.name ||
      this.editForm.type !== album.type ||
      Number(this.editForm.artistId) !== (album.artistId ?? album.artist?.id ?? 0) ||
      this.editForm.releaseDate !== (album.releaseDate ?? '') ||
      this.editForm.uploadedAt !== toDateTimeInputValue(album.uploadedAt) ||
      this.editForm.availableAt !== toDateTimeInputValue(album.availableAt) ||
      this.editForm.unavailableAt !== toDateTimeInputValue(album.unavailableAt)
    );
  }

  ngOnInit(): void {
    this.loadData();
  }

  public selectAlbum(album: AlbumType): void {
    this.selectedAlbum.set(album);
    this.selectedSongId.set(0);
    this.resetEditor(album);
  }

  public setKeyword(keyword: string): void {
    this.keyword.set(keyword);
    this.page.set(1);
  }

  public changePage(direction: -1 | 1): void {
    this.page.update((page) => Math.min(Math.max(page + direction, 1), this.pageCount()));
  }

  public async setImageFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imageFile = file;
    this.imagePreview.set(file ? await this.readFileAsDataUrl(file) : '');
    this.message.set(file ? '圖片已選擇，儲存後會更新封面。' : '');
  }

  public cancelChanges(): void {
    const album = this.selectedAlbum();
    if (album) {
      this.resetEditor(album);
      this.message.set('已還原尚未儲存的變更。');
    }
  }

  public isInvalid(field: string): boolean {
    return this.invalidFields().includes(field);
  }

  public async saveAlbum(): Promise<void> {
    const album = this.selectedAlbum();
    const invalidFields = this.validateForm();
    if (!album || invalidFields.length) {
      this.invalidFields.set(invalidFields.length ? invalidFields : ['album']);
      this.message.set('請確認紅框欄位是否填寫正確。');
      await showCmsError('儲存失敗', formatMissingFields(invalidFields, this.fieldLabels, '發行作品'));
      return;
    }

    this.isSaving.set(true);
    this.message.set('');
    this.invalidFields.set([]);

    try {
      const imgPath = this.imageFile ? await this.uploadImage(this.imageFile) : album.imgPath;
      await firstValueFrom(
        this.api.updateAlbum(album.id, {
          name: this.editForm.name.trim(),
          artistId: Number(this.editForm.artistId),
          type: this.editForm.type,
          imgPath,
          releaseDate: this.editForm.releaseDate,
          uploadedAt: fromDateTimeInputValue(this.editForm.uploadedAt),
          availableAt: fromDateTimeInputValue(this.editForm.availableAt),
          unavailableAt: fromDateTimeInputValue(this.editForm.unavailableAt),
        }),
      );
      await this.loadData();
      this.message.set('發行作品已儲存成功。');
      await showCmsSuccess('發行作品已儲存');
    } catch (err) {
      console.error('CMS 更新發行作品失敗：', err);
      const message = getCmsErrorMessage(err, '儲存失敗，請確認 API server 是否正常。');
      this.message.set(message);
      await showCmsError('儲存失敗', message);
    } finally {
      this.isSaving.set(false);
    }
  }

  public async addSongToAlbum(): Promise<void> {
    const album = this.selectedAlbum();
    const songId = Number(this.selectedSongId());
    if (!album || !songId) {
      this.message.set('請先選擇要加入的歌曲。');
      await showCmsError('加入失敗', '請先選擇要加入的歌曲。');
      return;
    }

    try {
      await firstValueFrom(this.api.updateSong(songId, { albumId: album.id }));
      await this.loadData();
      this.selectedSongId.set(0);
      this.message.set('歌曲已加入發行作品。');
      await showCmsSuccess('歌曲已加入');
    } catch (err) {
      console.error('CMS 加入發行作品歌曲失敗：', err);
      await showCmsError('加入失敗', getCmsErrorMessage(err));
    }
  }

  public async removeSongFromAlbum(song: SongType): Promise<void> {
    const fallbackAlbum = await this.getOrCreateSingleRelease(song);

    try {
      await firstValueFrom(this.api.updateSong(song.id, { albumId: fallbackAlbum.id }));
      await this.loadData();
      this.message.set('歌曲已移出發行作品。');
      await showCmsSuccess('歌曲已移出');
    } catch (err) {
      console.error('CMS 移出發行作品歌曲失敗：', err);
      await showCmsError('移出失敗', getCmsErrorMessage(err));
    }
  }

  public releaseLabel(album: AlbumType | null | undefined): string {
    return releaseTypeLabel(album?.type);
  }

  public statusLabel(album: AlbumType): string {
    return catalogStatusLabel(getCatalogStatus(album));
  }

  public isUnpublished(album: AlbumType | null): boolean {
    return getCatalogStatus(album) === 'unpublished';
  }

  public async unpublishAlbum(): Promise<void> {
    const album = this.selectedAlbum();
    if (!album) return;
    await this.catalogActions.unpublishAlbum(album, async () => {
      this.selectedAlbum.set(null);
      await this.loadData();
    });
  }

  public async republishAlbum(): Promise<void> {
    const album = this.selectedAlbum();
    if (!album) return;
    await this.catalogActions.republishAlbum(album, () => this.loadData());
  }

  public async deleteAlbum(): Promise<void> {
    const album = this.selectedAlbum();
    if (!album) return;
    await this.catalogActions.deleteAlbum(album, async () => {
      this.selectedAlbum.set(null);
      await this.loadData();
    });
  }

  private validateForm(): string[] {
    const invalid: string[] = [];
    if (!this.editForm.name.trim()) invalid.push('name');
    if (!Number(this.editForm.artistId)) invalid.push('artistId');
    return invalid;
  }

  private resetEditor(album: AlbumType): void {
    this.message.set('');
    this.invalidFields.set([]);
    this.imageFile = null;
    this.imagePreview.set('');
    this.editForm = {
      name: album.name,
      artistId: album.artistId ?? album.artist?.id ?? 0,
      type: (album.type as ReleaseType) || 'album',
      releaseDate: album.releaseDate ?? toDateInputValue(new Date()),
      uploadedAt: toDateTimeInputValue(album.uploadedAt ?? new Date()),
      availableAt: toDateTimeInputValue(album.availableAt ?? new Date()),
      unavailableAt: toDateTimeInputValue(album.unavailableAt),
    };
  }

  private async loadData(): Promise<void> {
    const [albums, artists, songs] = await Promise.all([
      firstValueFrom(this.api.getAllAlbum()),
      firstValueFrom(this.api.getAllArtist()),
      firstValueFrom(this.api.getAllSong()),
    ]);
    const albumItems = albums.filter((album) => album.type !== 'playlist');
    this.albums.set(albumItems);
    this.artists.set(artists);
    this.songs.set(songs);

    const current = this.selectedAlbum();
    if (current) {
      const refreshed = albumItems.find((album) => album.id === current.id);
      if (refreshed) this.selectAlbum(refreshed);
    } else if (albumItems.length) {
      this.selectAlbum(albumItems[0]);
    }

    this.page.set(Math.min(Math.max(this.page(), 1), this.pageCount()));
  }

  private async getOrCreateSingleRelease(song: SongType): Promise<AlbumType> {
    const artistId = song.artistId ?? song.artist?.id ?? this.artists()[0]?.id ?? 1;
    const existing = this.albums().find(
      (album) =>
        album.type === 'single' &&
        album.name.trim().toLowerCase() === song.name.trim().toLowerCase() &&
        (album.artistId ?? album.artist?.id) === artistId,
    );
    if (existing) return existing;

    const album = await firstValueFrom(
      this.api.createAlbum(song.name, artistId, song.imgPath || song.album?.imgPath || './mock/unnamed.png', 'single'),
    );
    this.albums.set([...this.albums(), album]);
    return album;
  }

  private async uploadImage(file: File): Promise<string> {
    const dataUrl = await this.readFileAsDataUrl(file);
    const result = await firstValueFrom(this.api.uploadFile(file.name, dataUrl, file.type));
    return result.path;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
