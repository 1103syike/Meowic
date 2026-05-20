import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NavigationContextService {
  public songBackUrl = signal<string | null>(null);

  setSongBackUrl(url: string): void {
    this.songBackUrl.set(url);
  }

  getSongBackUrl(fallbackUrl: string): string {
    return this.songBackUrl() ?? fallbackUrl;
  }
}
