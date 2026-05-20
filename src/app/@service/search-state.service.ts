import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  public isSearchOpen = signal(false);
  public query = signal('');

  openSearch(): void {
    this.isSearchOpen.set(true);
  }

  closeSearch(): void {
    this.isSearchOpen.set(false);
    this.query.set('');
  }

  setQuery(query: string): void {
    this.query.set(query);
  }
}
