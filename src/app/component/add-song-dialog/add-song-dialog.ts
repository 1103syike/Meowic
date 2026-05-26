import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AlbumType,
  ApiService,
  ArtistType,
  ReleaseType,
  releaseTypeOptions,
  toDateInputValue,
} from '../../@service/api.service';
import { showCmsError, showCmsSuccess } from '../../view/cms/cms-feedback';

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
  public invalidFields = signal<string[]>([]);
  public isArtistSuggestionsOpen = signal(false);
  public isAlbumSuggestionsOpen = signal(false);

  public songName = '';
  public artistName = '';
  public albumName = '';
  public releaseType: ReleaseType = 'single';
  public readonly releaseTypeOptions = releaseTypeOptions;
  private audioFile: File | null = null;
  private imageFile: File | null = null;

  ngOnInit(): void {
    this.loadSuggestions();
  }

  public closeDialog(): void {
    if (!this.isSubmitting()) this.close.emit();
  }

  public filteredArtists(): ArtistType[] {
    const keyword = this.artistName.trim().toLowerCase();
    if (!keyword) return [];
    return this.artists()
      .filter((artist) => artist.name.toLowerCase().includes(keyword))
      .slice(0, 5);
  }

  public filteredAlbums(): AlbumType[] {
    const keyword = this.albumName.trim().toLowerCase();
    if (!keyword) return [];
    return this.albums()
      .filter((album) => album.name.toLowerCase().includes(keyword))
      .slice(0, 5);
  }

  public selectArtist(name: string): void {
    this.artistName = name;
    this.invalidFields.update((fields) => fields.filter((field) => field !== 'artistName'));
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
    if (this.audioFile) {
      this.applySongNameFromAudioFile(this.audioFile);
      this.invalidFields.update((fields) => fields.filter((field) => field !== 'audioFile'));
    }
  }

  public setImageFile(event: Event): void {
    this.imageFile = this.getSelectedFile(event);
  }

  public isInvalid(field: string): boolean {
    return this.invalidFields().includes(field);
  }

  public async submit(): Promise<void> {
    this.errorMessage.set('');
    const invalidFields = this.validateForm();
    if (invalidFields.length) {
      this.invalidFields.set(invalidFields);
      this.errorMessage.set('請確認紅框欄位是否填寫正確。');
      await this.showError('新增失敗', `請補齊：${this.invalidFieldLabels(invalidFields).join('、')}`);
      return;
    }

    this.isSubmitting.set(true);
    this.invalidFields.set([]);
    try {
      const now = new Date();
      const audioPath = await this.uploadFile(this.audioFile as File);
      const imgPath = this.imageFile ? await this.uploadFile(this.imageFile) : '';
      const artist = await this.findOrCreateArtist(this.artistName);
      const album = await this.findOrCreateAlbum(
        this.albumName.trim() || this.songName,
        artist.id,
        imgPath || './mock/unnamed.png',
        this.albumName.trim() ? 'album' : this.releaseType,
      );

      await firstValueFrom(
        this.api.createSong({
          name: this.songName.trim(),
          artistId: artist.id,
          albumId: album.id,
          like: 0,
          playCount: 0,
          audioPath,
          releaseDate: album.releaseDate ?? toDateInputValue(now),
          uploadedAt: now.toISOString(),
          availableAt: now.toISOString(),
          ...(imgPath ? { imgPath } : {}),
        }),
      );

      this.created.emit();
      this.close.emit();
      await this.showSuccess('歌曲已新增');
    } catch (err) {
      console.error('新增歌曲失敗：', err);
      const message = this.getSubmitErrorMessage(err);
      this.errorMessage.set(message);
      await this.showError('新增失敗', message);
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
    this.albums.set(collections.filter((collection) => collection.type !== 'playlist'));
  }

  private validateForm(): string[] {
    const invalid: string[] = [];
    if (!this.songName.trim()) invalid.push('songName');
    if (!this.artistName.trim()) invalid.push('artistName');
    if (!this.audioFile) invalid.push('audioFile');
    return invalid;
  }

  private invalidFieldLabels(fields: string[]): string[] {
    const labels: Record<string, string> = {
      songName: '歌曲名稱',
      artistName: '藝人',
      audioFile: '歌曲音檔',
    };
    return fields.map((field) => labels[field] ?? field);
  }

  private getSelectedFile(event: Event): File | null {
    return (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  private applySongNameFromAudioFile(file: File): void {
    if (this.songName.trim()) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '').trim();
    const dashIndex = baseName.indexOf('-');
    const importedName = (dashIndex >= 0 ? baseName.slice(dashIndex + 1) : baseName).trim() || baseName;
    this.songName = importedName;
    this.invalidFields.update((fields) => fields.filter((field) => field !== 'songName'));
  }

  private async uploadFile(file: File): Promise<string> {
    const dataUrl = await this.readFileAsDataUrl(file);
    const result = await firstValueFrom(this.api.uploadFile(file.name, dataUrl, file.type));
    return result.path;
  }

  private getSubmitErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse && err.status === 404 && err.url?.endsWith('/upload')) {
      return '找不到上傳 API，請確認 API server 是否已啟動。';
    }

    if (err instanceof HttpErrorResponse && err.status === 413) {
      return '檔案太大，請改用較小的音檔或圖片。';
    }

    return '新增歌曲失敗，請稍後再試。';
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
    if (existingArtist) return existingArtist;
    return firstValueFrom(this.api.createArtist(name.trim()));
  }

  private async findOrCreateAlbum(
    name: string,
    artistId: number,
    imgPath: string,
    type: ReleaseType,
  ): Promise<AlbumType> {
    const existingAlbum = this.albums().find((album) => this.isSameName(album.name, name));
    if (existingAlbum) return existingAlbum;
    return firstValueFrom(this.api.createAlbum(name.trim(), artistId, imgPath, type));
  }

  private isSameName(currentName: string, inputName: string): boolean {
    return currentName.trim().toLowerCase() === inputName.trim().toLowerCase();
  }

  private async showSuccess(title: string): Promise<void> {
    await showCmsSuccess(title);
  }

  private async showError(title: string, text: string): Promise<void> {
    await showCmsError(title, text);
  }
}
