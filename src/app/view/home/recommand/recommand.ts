import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlbumType, ApiService } from '../../../@service/api.service';

@Component({
  selector: 'app-recommand',
  imports: [RouterLink],
  templateUrl: './recommand.html',
  styleUrl: './recommand.scss',
})
export class Recommand {
  ///////////////////////////////////////////////////////
  private route: ActivatedRoute = inject(ActivatedRoute);
  private api: ApiService = inject(ApiService);
  ///////////////////////////////////////////////////////
  public recommandAlbumList = signal<AlbumType[] | null>(null);
  ///////////////////////////////////////////////////////
  ngOnInit() {
    this.api.getAllAlbum().subscribe({
      next: (res: AlbumType[]) => {
        this.recommandAlbumList.set(res)
      },
      error: (err) => {},
    });
  }
}
