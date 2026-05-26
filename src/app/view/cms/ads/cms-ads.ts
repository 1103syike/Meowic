import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  AdvertisementLinkType,
  AdvertisementPlacement,
  AdvertisementType,
  AlbumType,
  ApiService,
  ArtistType,
  SongType,
} from '../../../@service/api.service';
import { getCmsErrorMessage, showCmsError, showCmsSuccess } from '../cms-feedback';

type LinkTargetItem = {
  id: number;
  title: string;
  subtitle: string;
  artistId?: number;
  imagePath?: string;
};

type AdForm = {
  title: string;
  subtitle: string;
  description: string;
  placement: AdvertisementPlacement;
  imagePath: string;
  imagePositionX: number;
  imagePositionY: number;
  buttonText: string;
  linkType: AdvertisementLinkType;
  linkTarget: string;
  enabled: boolean;
  sortOrder: number;
  startAt: string;
  endAt: string;
};

@Component({
  selector: 'app-cms-ads',
  imports: [FormsModule],
  templateUrl: './cms-ads.html',
  styleUrl: './cms-ads.scss',
})
export class CmsAds {
  private api: ApiService = inject(ApiService);

  public ads = signal<AdvertisementType[]>([]);
  public songs = signal<SongType[]>([]);
  public albums = signal<AlbumType[]>([]);
  public artists = signal<ArtistType[]>([]);
  public selectedAd = signal<AdvertisementType | null>(null);
  public imagePreview = signal('');
  public isSaving = signal(false);
  public message = signal('');
  public invalidFields = signal<string[]>([]);
  public targetKeyword = signal('');
  public selectedTargetArtistId = signal(0);

  public readonly placementOptions: { value: AdvertisementPlacement; label: string }[] = [
    { value: 'homeHero', label: '首頁 Hero' },
    { value: 'homeSmall', label: '首頁小卡' },
    { value: 'entryPopup', label: '進站彈窗' },
  ];
  public readonly linkOptions: { value: AdvertisementLinkType; label: string }[] = [
    { value: 'none', label: '無連結' },
    { value: 'song', label: '歌曲' },
    { value: 'album', label: '專輯' },
    { value: 'artist', label: '藝人' },
    { value: 'url', label: '外部網址' },
  ];

  public editForm: AdForm = this.emptyForm();
  private imageFile: File | null = null;
  private dragStart: { x: number; y: number; imageX: number; imageY: number; width: number; height: number } | null =
    null;

  public sortedAds = computed(() => [...this.ads()].sort((a, b) => a.sortOrder - b.sortOrder));

  public filteredTargets = computed(() => {
    const keyword = this.normalizeKeyword(this.targetKeyword());
    const artistId = Number(this.selectedTargetArtistId());
    return this.linkTargetItems()
      .filter((item) => !artistId || item.artistId === artistId)
      .filter((item) => {
        if (!keyword) return true;
        return [item.title, item.subtitle].some((value) => this.normalizeKeyword(value).includes(keyword));
      })
      .slice(0, 8);
  });

  ngOnInit(): void {
    this.loadData();
  }

  public selectAd(ad: AdvertisementType): void {
    this.selectedAd.set(ad);
    this.imageFile = null;
    this.imagePreview.set('');
    this.targetKeyword.set('');
    this.invalidFields.set([]);
    this.editForm = {
      title: ad.title,
      subtitle: ad.subtitle ?? '',
      description: ad.description ?? '',
      placement: ad.placement,
      imagePath: ad.imagePath,
      imagePositionX: ad.imagePositionX ?? 50,
      imagePositionY: ad.imagePositionY ?? 50,
      buttonText: ad.buttonText ?? '',
      linkType: ad.linkType,
      linkTarget: ad.linkTarget ?? '',
      enabled: ad.enabled,
      sortOrder: ad.sortOrder,
      startAt: this.toDateInputValue(ad.startAt),
      endAt: this.toDateInputValue(ad.endAt),
    };
    this.selectedTargetArtistId.set(this.initialTargetArtistId());
  }

  public newAd(): void {
    this.selectedAd.set(null);
    this.imageFile = null;
    this.imagePreview.set('');
    this.targetKeyword.set('');
    this.selectedTargetArtistId.set(0);
    this.invalidFields.set([]);
    this.editForm = this.emptyForm();
  }

  public async setImageFile(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.imageFile = file;
    this.imagePreview.set(file ? await this.readFileAsDataUrl(file) : '');
    if (file) this.invalidFields.update((fields) => fields.filter((field) => field !== 'imagePath'));
  }

  public onLinkTypeChange(): void {
    this.editForm.linkTarget = '';
    this.targetKeyword.set('');
    this.selectedTargetArtistId.set(0);
  }

  public selectTarget(item: LinkTargetItem): void {
    this.editForm.linkTarget = String(item.id);
    this.targetKeyword.set('');
    this.invalidFields.update((fields) => fields.filter((field) => field !== 'linkTarget'));
  }

  public selectedTargetLabel(): string {
    if (this.editForm.linkType === 'none') return '無連結';
    if (this.editForm.linkType === 'url') return this.editForm.linkTarget || '請輸入網址';
    const selected = this.linkTargetItems().find((item) => String(item.id) === String(this.editForm.linkTarget));
    return selected ? selected.title + ' | ' + selected.subtitle : '請選擇目標';
  }

  public startImageDrag(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      imageX: Number(this.editForm.imagePositionX) || 50,
      imageY: Number(this.editForm.imagePositionY) || 50,
      width: target.clientWidth || 1,
      height: target.clientHeight || 1,
    };
  }

  public moveImage(event: PointerEvent): void {
    if (!this.dragStart) return;
    const deltaX = ((event.clientX - this.dragStart.x) / this.dragStart.width) * 100;
    const deltaY = ((event.clientY - this.dragStart.y) / this.dragStart.height) * 100;
    this.editForm.imagePositionX = this.clampPosition(this.dragStart.imageX - deltaX);
    this.editForm.imagePositionY = this.clampPosition(this.dragStart.imageY - deltaY);
  }

  public stopImageDrag(): void {
    this.dragStart = null;
  }

  public imagePositionStyle(ad?: AdvertisementType | null): string {
    const x = ad?.imagePositionX ?? this.editForm.imagePositionX ?? 50;
    const y = ad?.imagePositionY ?? this.editForm.imagePositionY ?? 50;
    return `${x}% ${y}%`;
  }

  public isInvalid(field: string): boolean {
    return this.invalidFields().includes(field);
  }

  public placementLabel(placement: AdvertisementPlacement): string {
    return this.placementOptions.find((option) => option.value === placement)?.label ?? placement;
  }

  public async save(): Promise<void> {
    const invalidFields = this.validateForm();
    if (invalidFields.length) {
      this.invalidFields.set(invalidFields);
      this.message.set('請確認紅框欄位。');
      await this.showError('儲存失敗', '請補上：' + this.invalidFieldLabels(invalidFields).join('、'));
      return;
    }

    this.isSaving.set(true);
    this.message.set('');
    this.invalidFields.set([]);

    try {
      const imagePath = this.imageFile ? await this.uploadImage(this.imageFile) : this.editForm.imagePath.trim();
      const payload = {
        ...this.editForm,
        title: this.editForm.title.trim(),
        subtitle: this.editForm.subtitle.trim(),
        description: this.editForm.description.trim(),
        imagePath,
        imagePositionX: Number(this.editForm.imagePositionX) || 50,
        imagePositionY: Number(this.editForm.imagePositionY) || 50,
        buttonText: this.editForm.buttonText.trim(),
        linkTarget: this.editForm.linkType === 'none' ? '' : this.editForm.linkTarget.trim(),
        sortOrder: Number(this.editForm.sortOrder) || 1,
        startAt: this.toDateStartIso(this.editForm.startAt),
        endAt: this.toDateEndIso(this.editForm.endAt),
      };

      const current = this.selectedAd();
      if (current) {
        await firstValueFrom(this.api.updateAdvertisement(current.id, payload));
      } else {
        await firstValueFrom(this.api.createAdvertisement(payload));
      }

      await this.loadData();
      this.message.set('廣告已儲存。');
      await this.showSuccess('廣告已儲存');
    } catch (err) {
      console.error('CMS ad save failed:', err);
      this.message.set('儲存失敗，請確認 API server 是否正常。');
      await this.showError('儲存失敗', this.errorMessage(err));
    } finally {
      this.isSaving.set(false);
    }
  }

  public async deleteAd(): Promise<void> {
    const current = this.selectedAd();
    if (!current) return;

    try {
      await firstValueFrom(this.api.deleteAdvertisement(current.id));
      await this.loadData();
      this.newAd();
      this.message.set('廣告已刪除。');
      await this.showSuccess('廣告已刪除');
    } catch (err) {
      console.error('CMS ad delete failed:', err);
      await this.showError('刪除失敗', this.errorMessage(err));
    }
  }

  public previewImage(): string {
    return this.imagePreview() || this.editForm.imagePath || 'assets/images/ads/meowic-hero-new-release.png';
  }

  private async loadData(): Promise<void> {
    const [ads, songs, albums, artists] = await Promise.all([
      firstValueFrom(this.api.getAdvertisements()),
      firstValueFrom(this.api.getAllSong()),
      firstValueFrom(this.api.getAllAlbum()),
      firstValueFrom(this.api.getAllArtist()),
    ]);
    this.ads.set(ads);
    this.songs.set(songs);
    this.albums.set(albums.filter((album) => album.type !== 'playlist'));
    this.artists.set(artists);
    const current = this.selectedAd();
    if (current) {
      const refreshed = ads.find((ad) => ad.id === current.id);
      refreshed ? this.selectAd(refreshed) : this.newAd();
    } else if (!this.editForm.title && ads.length) {
      this.selectAd(ads[0]);
    }
  }

  private emptyForm(): AdForm {
    return {
      title: '',
      subtitle: '',
      description: '',
      placement: 'homeHero',
      imagePath: 'assets/images/ads/meowic-hero-new-release.png',
      imagePositionX: 50,
      imagePositionY: 50,
      buttonText: '查看推薦',
      linkType: 'none',
      linkTarget: '',
      enabled: true,
      sortOrder: 1,
      startAt: '',
      endAt: '',
    };
  }

  private linkTargetItems(): LinkTargetItem[] {
    if (this.editForm.linkType === 'song') {
      return this.songs().map((song) => ({
        id: song.id,
        title: song.name,
        subtitle: (song.artist?.name || '未知藝人') + ' | ' + (song.album?.name || '未知專輯'),
        artistId: song.artistId ?? song.artist?.id,
        imagePath: song.imgPath || song.album?.imgPath,
      }));
    }

    if (this.editForm.linkType === 'album') {
      return this.albums().map((album) => ({
        id: album.id,
        title: album.name,
        subtitle: album.artist?.name || '未知藝人',
        artistId: album.artistId ?? album.artist?.id,
        imagePath: album.imgPath,
      }));
    }

    if (this.editForm.linkType === 'artist') {
      return this.artists().map((artist) => ({
        id: artist.id,
        title: artist.name,
        subtitle: artist.description || '藝人',
        artistId: artist.id,
        imagePath: artist.imgPath,
      }));
    }

    return [];
  }

  private validateForm(): string[] {
    const invalid: string[] = [];
    if (!this.editForm.title.trim()) invalid.push('title');
    if (!this.imageFile && !this.editForm.imagePath.trim()) invalid.push('imagePath');
    if (this.editForm.linkType !== 'none' && !this.editForm.linkTarget.trim()) invalid.push('linkTarget');
    if (!Number(this.editForm.sortOrder)) invalid.push('sortOrder');
    return invalid;
  }

  private invalidFieldLabels(fields: string[]): string[] {
    const labels: Record<string, string> = {
      title: '標題',
      imagePath: '圖片',
      linkTarget: '連結目標',
      sortOrder: '排序',
    };
    return fields.map((field) => labels[field] ?? field);
  }

  private initialTargetArtistId(): number {
    const selected = this.linkTargetItems().find((item) => String(item.id) === String(this.editForm.linkTarget));
    return selected?.artistId ?? 0;
  }

  private normalizeKeyword(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  private toDateInputValue(value: string | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return localDate.toISOString().slice(0, 10);
  }

  private toDateStartIso(value: string): string {
    return value ? new Date(`${value}T00:00:00`).toISOString() : '';
  }

  private toDateEndIso(value: string): string {
    return value ? new Date(`${value}T23:59:59.999`).toISOString() : '';
  }

  private clampPosition(value: number): number {
    return Math.min(100, Math.max(0, Math.round(value)));
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

  private async showSuccess(title: string): Promise<void> {
    await showCmsSuccess(title);
  }

  private async showError(title: string, text: string): Promise<void> {
    await showCmsError(title, text);
  }

  private errorMessage(err: unknown): string {
    return getCmsErrorMessage(err);
  }
}
