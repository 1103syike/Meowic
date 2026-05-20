import { Component, inject } from '@angular/core';
import { SearchStateService } from '../../@service/search-state.service';
import { SongList } from '../../component/song-list/song-list';
import { Celebrity } from './celebrity/celebrity';
import { Popular } from './popular/popular';
import { Recommand } from './recommand/recommand';

@Component({
  selector: 'app-home',
  imports: [Recommand, Popular, Celebrity, SongList],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  public searchState: SearchStateService = inject(SearchStateService);
}
