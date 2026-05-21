import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService, ArtistType } from '../../../@service/api.service';

@Component({
  selector: 'app-cms-artists',
  imports: [FormsModule],
  templateUrl: './cms-artists.html',
  styleUrl: './cms-artists.scss',
})
export class CmsArtists {
  private api: ApiService = inject(ApiService);

  public artists = signal<ArtistType[]>([]);
  public imagePreview = signal('');
  public selectedArtist = signal<ArtistType | null>(null);
  public isSaving = signal(false);
  public message = signal('');
  public keyword = signal('');
  public page = signal(1);
  public readonly pageSize = 8;

  public editForm = {
    name: '',
    description: '',
  };

  private imageFile: File | null = null;

  public selectedArtistImage = computed(() => {
    const artist = this.selectedArtist();
    return this.imagePreview() || artist?.imgPath || './mock/unnamed.png';
  });

  public filteredArtists = computed(() => {
    const keyword = this.keyword().trim().toLowerCase();
    if (!keyword) return this.artists();

    return this.artists().filter((artist) =>
      [artist.name, artist.description].some((value) =>
        (value ?? '').toLowerCase().includes(keyword),
      ),
    );
  });

  public pagedArtists = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredArtists().slice(start, start + this.pageSize);
  });

  public pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filteredArtists().length / this.pageSize)),
  );

  public hasPendingChanges(): boolean {
    const artist = this.selectedArtist();
    if (!artist) {
      return false;
    }

    return (
      !!this.imagePreview() ||
      this.editForm.name !== artist.name ||
      this.editForm.description !== artist.description
    );
  }

  ngOnInit() {
    this.loadArtists();
  }

  public selectArtist(artist: ArtistType): void {
    this.selectedArtist.set(artist);
    this.resetEditor(artist);
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
    const artist = this.selectedArtist();
    if (artist) {
      this.resetEditor(artist);
      this.message.set('已取消未儲存變更');
    }
  }

  public async saveArtist(): Promise<void> {
    const artist = this.selectedArtist();
    if (!artist || !this.editForm.name.trim()) {
      this.message.set('請填寫藝人名稱');
      return;
    }

    this.isSaving.set(true);
    this.message.set('');

    try {
      const imgPath = this.imageFile ? await this.uploadImage(this.imageFile) : artist.imgPath;
      await firstValueFrom(
        this.api.updateArtist(artist.id, {
          name: this.editForm.name.trim(),
          description: this.editForm.description.trim(),
          imgPath,
        }),
      );
      await this.loadArtists();
      this.message.set('藝人資料已更新');
    } catch (err) {
      console.error('CMS 更新藝人失敗：', err);
      this.message.set('更新失敗，請稍後再試');
    } finally {
      this.isSaving.set(false);
    }
  }

  private resetEditor(artist: ArtistType): void {
    this.message.set('');
    this.imageFile = null;
    this.imagePreview.set('');
    this.editForm = {
      name: artist.name,
      description: artist.description,
    };
  }

  private async loadArtists(): Promise<void> {
    const artists = await firstValueFrom(this.api.getAllArtist());
    this.artists.set(artists);

    const current = this.selectedArtist();
    if (current) {
      const refreshed = artists.find((artist) => artist.id === current.id);
      if (refreshed) {
        this.selectArtist(refreshed);
      }
    } else if (artists.length) {
      this.selectArtist(artists[0]);
    }

    this.page.set(Math.min(Math.max(this.page(), 1), this.pageCount()));
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
