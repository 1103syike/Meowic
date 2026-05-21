import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AlbumType, ApiService, ArtistType, SongType } from '../../../@service/api.service';

@Component({
  selector: 'app-cms-albums',
  imports: [FormsModule],
  templateUrl: './cms-albums.html',
  styleUrl: './cms-albums.scss',
})
export class CmsAlbums {
  private api: ApiService = inject(ApiService);

  public albums = signal<AlbumType[]>([]);
  public artists = signal<ArtistType[]>([]);
  public imagePreview = signal('');
  public songs = signal<SongType[]>([]);
  public selectedAlbum = signal<AlbumType | null>(null);
  public selectedSongId = signal(0);
  public isSaving = signal(false);
  public message = signal('');
  public keyword = signal('');
  public page = signal(1);
  public readonly pageSize = 6;

  public editForm = {
    name: '',
    artistId: 0,
  };

  private imageFile: File | null = null;

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

  public pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredAlbums().length / this.pageSize)),
  );

  public hasPendingChanges(): boolean {
    const album = this.selectedAlbum();
    if (!album) {
      return false;
    }

    return (
      !!this.imagePreview() ||
      this.editForm.name !== album.name ||
      Number(this.editForm.artistId) !== (album.artistId ?? album.artist?.id ?? 0)
    );
  }

  public albumSongs = computed(() => {
    const album = this.selectedAlbum();
    if (!album) {
      return [];
    }

    return this.songs().filter((song) => (song.albumId ?? song.album?.id) === album.id);
  });

  public availableSongs = computed(() => {
    const album = this.selectedAlbum();
    if (!album) {
      return [];
    }

    return this.songs().filter((song) => (song.albumId ?? song.album?.id) !== album.id);
  });

  ngOnInit() {
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
    this.message.set(file ? '圖片已預覽，按下儲存後才會更新' : '');
  }

  public cancelChanges(): void {
    const album = this.selectedAlbum();
    if (album) {
      this.resetEditor(album);
      this.message.set('已取消未儲存變更');
    }
  }

  public async saveAlbum(): Promise<void> {
    const album = this.selectedAlbum();
    if (!album || !this.editForm.name.trim() || !this.editForm.artistId) {
      this.message.set('請填寫專輯名稱與所屬歌手');
      return;
    }

    this.isSaving.set(true);
    this.message.set('');

    try {
      const imgPath = this.imageFile ? await this.uploadImage(this.imageFile) : album.imgPath;
      await firstValueFrom(
        this.api.updateAlbum(album.id, {
          name: this.editForm.name.trim(),
          artistId: Number(this.editForm.artistId),
          imgPath,
        }),
      );
      await this.loadData();
      this.message.set('專輯已更新');
    } catch (err) {
      console.error('CMS 更新專輯失敗：', err);
      this.message.set('更新失敗，請稍後再試');
    } finally {
      this.isSaving.set(false);
    }
  }

  public async addSongToAlbum(): Promise<void> {
    const album = this.selectedAlbum();
    const songId = Number(this.selectedSongId());
    if (!album || !songId) {
      this.message.set('請先選擇要加入的歌曲');
      return;
    }

    try {
      await firstValueFrom(this.api.updateSong(songId, { albumId: album.id }));
      await this.loadData();
      this.selectedSongId.set(0);
      this.message.set('歌曲已加入專輯');
    } catch (err) {
      console.error('CMS 加入專輯歌曲失敗：', err);
      this.message.set('加入失敗，請稍後再試');
    }
  }

  public async removeSongFromAlbum(song: SongType): Promise<void> {
    const fallbackAlbum = await this.getOrCreateUncategorizedAlbum(song.artistId ?? song.artist?.id);

    try {
      await firstValueFrom(this.api.updateSong(song.id, { albumId: fallbackAlbum.id }));
      await this.loadData();
      this.message.set('歌曲已移到未分類');
    } catch (err) {
      console.error('CMS 移出專輯歌曲失敗：', err);
      this.message.set('移出失敗，請稍後再試');
    }
  }

  private resetEditor(album: AlbumType): void {
    this.message.set('');
    this.imageFile = null;
    this.imagePreview.set('');
    this.editForm = {
      name: album.name,
      artistId: album.artistId ?? album.artist?.id ?? 0,
    };
  }

  private async loadData(): Promise<void> {
    const [albums, artists, songs] = await Promise.all([
      firstValueFrom(this.api.getAllAlbum()),
      firstValueFrom(this.api.getAllArtist()),
      firstValueFrom(this.api.getAllSong()),
    ]);
    const albumItems = albums.filter((album) => album.type === 'album');
    this.albums.set(albumItems);
    this.artists.set(artists);
    this.songs.set(songs);

    const current = this.selectedAlbum();
    if (current) {
      const refreshed = albumItems.find((album) => album.id === current.id);
      if (refreshed) {
        this.selectAlbum(refreshed);
      }
    } else if (albumItems.length) {
      this.selectAlbum(albumItems[0]);
    }

    this.page.set(Math.min(Math.max(this.page(), 1), this.pageCount()));
  }

  private async getOrCreateUncategorizedAlbum(artistId = 0): Promise<AlbumType> {
    const existing = this.albums().find((album) => album.name === '未分類');
    if (existing) {
      return existing;
    }

    const ownerArtistId = artistId || this.artists()[0]?.id || 1;
    const album = await firstValueFrom(
      this.api.createAlbum('未分類', ownerArtistId, './mock/unnamed.png'),
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
