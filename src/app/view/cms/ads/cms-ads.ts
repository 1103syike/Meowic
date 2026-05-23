import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AdvertisementLinkType,
  AdvertisementPlacement,
  AdvertisementType,
  ApiService,
  fromDateTimeInputValue,
  toDateTimeInputValue,
} from '../../../@service/api.service';

@Component({
  selector: 'app-cms-ads',
  imports: [FormsModule],
  templateUrl: './cms-ads.html',
  styleUrl: './cms-ads.scss',
})
export class CmsAds {
  private api: ApiService = inject(ApiService);

  public ads = signal<AdvertisementType[]>([]);
  public selectedAd = signal<AdvertisementType | null>(null);
  public imagePreview = signal('');
  public isSaving = signal(false);
  public message = signal('');

  public readonly placementOptions: { value: AdvertisementPlacement; label: string }[] = [
    { value: 'homeHero', label: '首頁 Hero' },
    { value: 'homeSmall', label: '首頁小看板' },
    { value: 'entryPopup', label: '進站彈窗' },
  ];
  public readonly linkOptions: { value: AdvertisementLinkType; label: string }[] = [
    { value: 'none', label: '無連結' },
    { value: 'song', label: '歌曲' },
    { value: 'album', label: '發行作品' },
    { value: 'artist', label: '藝人' },
    { value: 'url', label: '外部網址' },
  ];

  public editForm = this.emptyForm();
  private imageFile: File | null = null;

  public sortedAds = computed(() => [...this.ads()].sort((a, b) => a.sortOrder - b.sortOrder));

  ngOnInit(): void {
    this.loadData();
  }

  public selectAd(ad: AdvertisementType): void {
    this.selectedAd.set(ad);
    this.imageFile = null;
    this.imagePreview.set('');
    this.editForm = {
      title: ad.title,
      subtitle: ad.subtitle ?? '',
      description: ad.description ?? '',
      placement: ad.placement,
      imagePath: ad.imagePath,
      buttonText: ad.buttonText ?? '',
      linkType: ad.linkType,
      linkTarget: ad.linkTarget ?? '',
      enabled: ad.enabled,
      sortOrder: ad.sortOrder,
      startAt: toDateTimeInputValue(ad.startAt),
      endAt: toDateTimeInputValue(ad.endAt),
    };
  }

  public newAd(): void {
    this.selectedAd.set(null);
    this.imageFile = null;
    this.imagePreview.set('');
    this.editForm = this.emptyForm();
  }

  public async setImageFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imageFile = file;
    this.imagePreview.set(file ? await this.readFileAsDataUrl(file) : '');
  }

  public async save(): Promise<void> {
    if (!this.editForm.title.trim() || !this.editForm.imagePath.trim()) {
      this.message.set('請填寫標題與圖片路徑');
      return;
    }

    this.isSaving.set(true);
    this.message.set('');

    try {
      const imagePath = this.imageFile ? await this.uploadImage(this.imageFile) : this.editForm.imagePath.trim();
      const payload = {
        ...this.editForm,
        title: this.editForm.title.trim(),
        subtitle: this.editForm.subtitle.trim(),
        description: this.editForm.description.trim(),
        imagePath,
        buttonText: this.editForm.buttonText.trim(),
        linkTarget: this.editForm.linkTarget.trim(),
        sortOrder: Number(this.editForm.sortOrder) || 1,
        startAt: fromDateTimeInputValue(this.editForm.startAt),
        endAt: fromDateTimeInputValue(this.editForm.endAt),
      };

      const current = this.selectedAd();
      if (current) {
        await firstValueFrom(this.api.updateAdvertisement(current.id, payload));
      } else {
        await firstValueFrom(this.api.createAdvertisement(payload));
      }

      await this.loadData();
      this.message.set('廣告已儲存');
    } catch (err) {
      console.error('CMS 儲存廣告失敗：', err);
      this.message.set('儲存失敗，請確認 API server 是否開啟');
    } finally {
      this.isSaving.set(false);
    }
  }

  public async deleteAd(): Promise<void> {
    const current = this.selectedAd();
    if (!current) return;

    await firstValueFrom(this.api.deleteAdvertisement(current.id));
    await this.loadData();
    this.newAd();
    this.message.set('廣告已刪除');
  }

  public previewImage(): string {
    return this.imagePreview() || this.editForm.imagePath || 'assets/images/ads/meowic-hero-new-release.png';
  }

  private async loadData(): Promise<void> {
    const ads = await firstValueFrom(this.api.getAdvertisements());
    this.ads.set(ads);
    const current = this.selectedAd();
    if (current) {
      const refreshed = ads.find((ad) => ad.id === current.id);
      refreshed ? this.selectAd(refreshed) : this.newAd();
    } else if (!this.editForm.title && ads.length) {
      this.selectAd(ads[0]);
    }
  }

  private emptyForm() {
    return {
      title: '',
      subtitle: '',
      description: '',
      placement: 'homeHero' as AdvertisementPlacement,
      imagePath: 'assets/images/ads/meowic-hero-new-release.png',
      buttonText: '立即查看',
      linkType: 'none' as AdvertisementLinkType,
      linkTarget: '',
      enabled: true,
      sortOrder: 1,
      startAt: '',
      endAt: '',
    };
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
