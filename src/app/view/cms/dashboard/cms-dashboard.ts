import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../@service/api.service';

@Component({
  selector: 'app-cms-dashboard',
  templateUrl: './cms-dashboard.html',
  styleUrl: './cms-dashboard.scss',
})
export class CmsDashboard {
  private api: ApiService = inject(ApiService);

  public songCount = signal(0);
  public albumCount = signal(0);
  public artistCount = signal(0);

  ngOnInit() {
    this.loadCounts();
  }

  private async loadCounts(): Promise<void> {
    const [songs, albums, artists] = await Promise.all([
      firstValueFrom(this.api.getAllSong()),
      firstValueFrom(this.api.getAllAlbum()),
      firstValueFrom(this.api.getAllArtist()),
    ]);

    this.songCount.set(songs.length);
    this.albumCount.set(albums.filter((album) => album.type === 'album').length);
    this.artistCount.set(artists.length);
  }
}
