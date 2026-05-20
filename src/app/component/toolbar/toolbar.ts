import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { SearchStateService } from '../../@service/search-state.service';

@Component({
  selector: 'app-toolbar',
  imports: [FormsModule, MatIconModule, RouterLink],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
  host: {
    class: 'toolbar',
  },
})
export class Toolbar {
  public searchState: SearchStateService = inject(SearchStateService);

  public openSearch(): void {
    this.searchState.openSearch();
  }

  public updateSearch(query: string): void {
    this.searchState.setQuery(query);
  }
}
