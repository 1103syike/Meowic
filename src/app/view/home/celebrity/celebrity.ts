import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ApiService, ArtistType } from '../../../@service/api.service';

@Component({
  selector: 'app-celebrity',
  imports: [RouterLink],
  templateUrl: './celebrity.html',
  styleUrl: './celebrity.scss',
})
export class Celebrity {
  private api: ApiService = inject(ApiService);

  public celebrities = signal<ArtistType[]>([]);

  ngOnInit() {
    forkJoin({
      artists: this.api.getAllArtist(),
      recommendations: this.api.getHomeRecommendations().pipe(catchError(() => of([]))),
    }).subscribe(({ artists, recommendations }) => {
      const popularArtistIds = recommendations[0]?.popularArtistIds ?? [];
      const selectedArtists = popularArtistIds
        .map((id) => artists.find((artist) => artist.id === id))
        .filter((artist): artist is ArtistType => !!artist);

      this.celebrities.set(selectedArtists.length ? selectedArtists : artists.slice(0, 5));
    });
  }
}
