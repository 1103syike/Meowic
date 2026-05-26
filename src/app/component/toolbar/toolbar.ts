import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { SearchStateService } from '../../@service/search-state.service';

@Component({
  selector: 'app-toolbar',
  imports: [FormsModule, MatIconModule],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  host: {
    class: 'toolbar',
  },
})
export class Toolbar {
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  public searchState: SearchStateService = inject(SearchStateService);
  private router: Router = inject(Router);

  public async openSearch(): Promise<void> {
    this.searchState.openSearchFrom(this.router.url);

    if (!this.router.url.startsWith('/search')) {
      await this.router.navigateByUrl('/search');
    }

    requestAnimationFrame(() => this.searchInput?.nativeElement.focus());
  }

  public updateSearch(query: string): void {
    this.searchState.setQuery(query);
  }

  public collapseSearchIfEmpty(): void {
    setTimeout(() => {
      if (!this.searchState.query().trim()) {
        const returnUrl = this.searchState.closeSearchAndGetReturnUrl();

        if (this.router.url.startsWith('/search')) {
          this.router.navigateByUrl(returnUrl);
        }
      }
    }, 120);
  }
}
