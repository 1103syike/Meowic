import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { AlbumType, ApiService, ArtistType } from '../../@service/api.service';

@Component({
  selector: 'app-add-song-dialog',
  imports: [FormsModule],
  templateUrl: './add-song-dialog.html',
  styleUrl: './add-song-dialog.scss',
})
export class AddSongDialog {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  private api: ApiService = inject(ApiService);

  public artists = signal<ArtistType[]>([]);
  public albums = signal<AlbumType[]>([]);
  public isSubmitting = signal(false);
  public errorMessage = signal('');
  public isArtistSuggestionsOpen = signal(false);
  public isAlbumSuggestionsOpen = signal(false);

  public songName = '';
  public artistName = '';
  public albumName = '';
  private audioFile: File | null = null;
  private imageFile: File | null = null;

  ngOnInit() {
    this.loadSuggestions();
  }

  public closeDialog(): void {
    if (!this.isSubmitting()) {
      this.close.emit();
    }
  }

  public filteredArtists(): ArtistType[] {
    const keyword = this.artistName.trim().toLowerCase();
    if (!keyword) {
      return [];
    }

    return this.artists()
      .filter((artist) => artist.name.toLowerCase().includes(keyword))
      .slice(0, 5);
  }

  public filteredAlbums(): AlbumType[] {
    const keyword = this.albumName.trim().toLowerCase();
    if (!keyword) {
      return [];
    }

    return this.albums()
      .filter((album) => album.name.toLowerCase().includes(keyword))
      .slice(0, 5);
  }

  public selectArtist(name: string): void {
    this.artistName = name;
    this.isArtistSuggestionsOpen.set(false);
  }

  public selectAlbum(name: string): void {
    this.albumName = name;
    this.isAlbumSuggestionsOpen.set(false);
  }

  public hideArtistSuggestions(): void {
    setTimeout(() => this.isArtistSuggestionsOpen.set(false));
  }

  public hideAlbumSuggestions(): void {
    setTimeout(() => this.isAlbumSuggestionsOpen.set(false));
  }

  public setAudioFile(event: Event): void {
    this.audioFile = this.getSelectedFile(event);
  }

  public setImageFile(event: Event): void {
    this.imageFile = this.getSelectedFile(event);
  }

  public async submit(): Promise<void> {
    this.errorMessage.set('');

    if (!this.songName.trim() || !this.artistName.trim() || !this.albumName.trim() || !this.audioFile) {
      this.errorMessage.set('請填寫歌曲名稱、歌手、專輯，並選擇歌曲檔案');
      return;
    }

    this.isSubmitting.set(true);
    try {
      const audioPath = await this.uploadFile(this.audioFile);
      const imgPath = this.imageFile ? await this.uploadFile(this.imageFile) : '';
      const artist = await this.findOrCreateArtist(this.artistName);
      const album = await this.findOrCreateAlbum(
        this.albumName,
        artist.id,
        imgPath || './mock/unnamed.png',
      );

      await firstValueFrom(
        this.api.createSong({
          name: this.songName.trim(),
          artistId: artist.id,
          albumId: album.id,
          like: 0,
          audioPath,
          ...(imgPath ? { imgPath } : {}),
        }),
      );

      this.created.emit();
      this.close.emit();
      Swal.fire({ title: '新增成功', text: '歌曲已新增到資料庫', icon: 'success' });
    } catch (err) {
      console.error('新增歌曲失敗：', err);
      this.errorMessage.set(this.getSubmitErrorMessage(err));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async loadSuggestions(): Promise<void> {
    const [artists, collections] = await Promise.all([
      firstValueFrom(this.api.getAllArtist()),
      firstValueFrom(this.api.getAllAlbum()),
    ]);

    this.artists.set(artists);
    this.albums.set(collections.filter((collection) => collection.type === 'album'));
  }

  private getSelectedFile(event: Event): File | null {
    return (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  private async uploadFile(file: File): Promise<string> {
    const dataUrl = await this.readFileAsDataUrl(file);
    const result = await firstValueFrom(this.api.uploadFile(file.name, dataUrl, file.type));
    return result.path;
  }

  private getSubmitErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 404 && err.url?.endsWith('/upload')) {
      return '找不到上傳 API，請確認後端是用 npm run api 啟動，而不是純 json-server。';
    }

    if (err instanceof HttpErrorResponse && err.status === 413) {
      return '檔案太大，請換小一點的音樂或圖片檔案。';
    }

    return '新增歌曲失敗，請再試一次';
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async findOrCreateArtist(name: string): Promise<ArtistType> {
    const existingArtist = this.artists().find((artist) => this.isSameName(artist.name, name));
    if (existingArtist) {
      return existingArtist;
    }

    return firstValueFrom(this.api.createArtist(name.trim()));
  }

  private async findOrCreateAlbum(
    name: string,
    artistId: number,
    imgPath: string,
  ): Promise<AlbumType> {
    const existingAlbum = this.albums().find((album) => this.isSameName(album.name, name));
    if (existingAlbum) {
      return existingAlbum;
    }

    return firstValueFrom(this.api.createAlbum(name.trim(), artistId, imgPath));
  }

  private isSameName(currentName: string, inputName: string): boolean {
    return currentName.trim().toLowerCase() === inputName.trim().toLowerCase();
  }
}
