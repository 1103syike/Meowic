import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService, SongType } from '../../../@service/api.service';
import { MusicPlayerService } from '../../../@service/music-player.service';
import { NavigationContextService } from '../../../@service/navigation-context.service';
import { PlaybackQueueService } from '../../../@service/playback-queue.service';
import { SearchStateService } from '../../../@service/search-state.service';

@Component({
  selector: 'app-popular',
  templateUrl: './popular.html',
  styleUrl: './popular.scss',
})
export class Popular {
  private api: ApiService = inject(ApiService);
  private music: MusicPlayerService = inject(MusicPlayerService);
  private navigationContext: NavigationContextService = inject(NavigationContextService);
  private playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  private router: Router = inject(Router);
  private searchState: SearchStateService = inject(SearchStateService);

  public populars = signal<SongType[]>([]);

  ngOnInit() {
    forkJoin({
      songs: this.api.getAllSong(),
      recommendations: this.api.getHomeRecommendations().pipe(catchError(() => of([]))),
    }).subscribe(({ songs, recommendations }) => {
      const popularSongIds = recommendations[0]?.popularSongIds ?? [];
      const selectedSongs = popularSongIds
        .map((id) => songs.find((song) => song.id === id))
        .filter((song): song is SongType => !!song);

      this.populars.set(selectedSongs.length ? selectedSongs : songs.slice(0, 5));
    });
  }

  public playSong(song: SongType): void {
    const songs = this.populars();
    this.playbackQueue.setQueue(
      {
        title: '熱門歌曲',
        source: 'temporary',
        songs: [song],
        autoSongs: songs.filter((item) => item.id !== song.id),
        recommendationPool: songs,
      },
      song.id,
    );
    this.music.setPlayer(song.id.toString());
    this.music.setIsClose(false);
    this.navigationContext.setSongBackUrl('/');
    this.searchState.closeSearch();
    this.router.navigate(['/song', song.id]);
  }
}
