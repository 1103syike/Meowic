import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  public isSearchOpen = signal(false);
  public query = signal('');
  private returnUrl = signal('/');

  openSearch(): void {
    this.isSearchOpen.set(true);
  }

  openSearchFrom(url: string): void {
    if (url && !url.startsWith('/search')) {
      this.returnUrl.set(url);
    }

    this.openSearch();
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
    this.query.set('');
  }

  closeSearchAndGetReturnUrl(): string {
    const url = this.returnUrl() || '/';
    this.closeSearch();
    return url;
  }

  setQuery(query: string): void {
    this.query.set(query);
  }
}
