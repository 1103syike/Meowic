import { Component, inject } from '@angular/core';
import { SearchStateService } from '../../@service/search-state.service';
import { SearchResults } from '../../component/search-results/search-results';
import { HomeAds } from './ads/home-ads';
import { Celebrity } from './celebrity/celebrity';
import { Popular } from './popular/popular';
import { Recommand } from './recommand/recommand';

@Component({
  selector: 'app-home',
  imports: [HomeAds, Recommand, Popular, Celebrity, SearchResults],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  public searchState: SearchStateService = inject(SearchStateService);
}
