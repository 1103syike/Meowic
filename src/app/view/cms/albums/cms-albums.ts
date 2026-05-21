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
  public songs = signal<SongType[]>([]);
  public selectedAlbum = signal<AlbumType | null>(null);
  public selectedSongId = signal(0);
  public isSaving = signal(false);
  public message = signal('');

  public editForm = {
    name: '',
    artistId: 0,
  };

  private imageFile: File | null = null;

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
    this.message.set('');
    this.imageFile = null;
    this.editForm = {
      name: album.name,
      artistId: album.artistId ?? album.artist?.id ?? 0,
    };
  }

  public setImageFile(event: Event): void {
    this.imageFile = (event.target as HTMLInputElement).files?.[0] ?? null;
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
