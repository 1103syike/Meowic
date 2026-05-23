import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AdvertisementType, ApiService } from '../../../@service/api.service';

@Component({
  selector: 'app-home-ads',
  templateUrl: './home-ads.html',
  styleUrl: './home-ads.scss',
})
export class HomeAds {
  private api: ApiService = inject(ApiService);
  private router: Router = inject(Router);
  private readonly popupDismissKey = 'meowic-ad-popup-dismissed-date';

  public ads = signal<AdvertisementType[]>([]);
  public isPopupOpen = signal(false);

  public heroAd = computed(() => this.activeAds().find((ad) => ad.placement === 'homeHero'));
  public smallAds = computed(() => this.activeAds().filter((ad) => ad.placement === 'homeSmall').slice(0, 2));
  public popupAd = computed(() => this.activeAds().find((ad) => ad.placement === 'entryPopup'));

  ngOnInit(): void {
    this.api.getAdvertisements().subscribe({
      next: (ads) => {
        this.ads.set(ads);
        this.openPopupIfNeeded();
      },
      error: (err) => console.error('載入廣告失敗：', err),
    });
  }

  public openAd(ad: AdvertisementType | undefined): void {
    if (!ad || ad.linkType === 'none' || !ad.linkTarget) {
      return;
    }

    if (ad.linkType === 'url') {
      window.open(ad.linkTarget, '_blank', 'noopener');
      return;
    }

    const routeMap = {
      song: '/song',
      album: '/album',
      artist: '/artist',
    };
    this.router.navigate([routeMap[ad.linkType], ad.linkTarget]);
  }

  public closePopup(todayOnly = false): void {
    if (todayOnly) {
      localStorage.setItem(this.popupDismissKey, this.todayKey());
    }
    this.isPopupOpen.set(false);
  }

  private activeAds(): AdvertisementType[] {
    const now = Date.now();
    return this.ads()
      .filter((ad) => {
        if (!ad.enabled) return false;
        const starts = ad.startAt ? new Date(ad.startAt).getTime() : Number.NEGATIVE_INFINITY;
        const ends = ad.endAt ? new Date(ad.endAt).getTime() : Number.POSITIVE_INFINITY;
        return starts <= now && now <= ends;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private openPopupIfNeeded(): void {
    const popup = this.popupAd();
    const dismissedDate = localStorage.getItem(this.popupDismissKey);
    this.isPopupOpen.set(!!popup && dismissedDate !== this.todayKey());
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
