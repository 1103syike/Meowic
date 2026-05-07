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
        console.log(res);
      },
      error: (err) => {},
    });
  }
  public recommands = [
    { title: '離開我的依賴', path: './mock/home/recommand/img-1.png' },
    { title: 'Beauty and the Beast', path: './mock/home/recommand/img-2.png' },
    { title: '若無你我欲去佗位', path: './mock/home/recommand/img-3.png' },
    { title: '太陽之子', path: './mock/home/recommand/img-4.png' },
    { title: '兩三句', path: './mock/home/recommand/img-5.png' },
    { title: '安合橋', path: './mock/home/recommand/img-6.png' },
  ];
}
