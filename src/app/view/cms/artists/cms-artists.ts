import { Component, inject, signal } from '@angular/core';
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
  public selectedArtist = signal<ArtistType | null>(null);
  public isSaving = signal(false);
  public message = signal('');

  public editForm = {
    name: '',
    description: '',
  };

  private imageFile: File | null = null;

  ngOnInit() {
    this.loadArtists();
  }

  public selectArtist(artist: ArtistType): void {
    this.selectedArtist.set(artist);
    this.message.set('');
    this.imageFile = null;
    this.editForm = {
      name: artist.name,
      description: artist.description,
    };
  }

  public setImageFile(event: Event): void {
    this.imageFile = (event.target as HTMLInputElement).files?.[0] ?? null;
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
