import { Component, inject, signal } from '@angular/core';
import { Lyric } from './lyric/lyric';
import { Artist } from './artist/artist';
import { ApiService, SongType } from '../../@service/api.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-song',
  imports: [Lyric, Artist],
  templateUrl: './song.html',
  styleUrl: './song.scss',
})
export class Song {
  /////////////////////////////////////////////
  private route: ActivatedRoute = inject(ActivatedRoute);
  private api: ApiService = inject(ApiService);
  /////////////////////////////////////////////
  public currentSong = signal<SongType | null>(null);
  /////////////////////////////////////////////

  ngOnInit() {
    this.route.paramMap.subscribe((res) => {
      const songId = res.get('id') as string;
      this.api.getSongById(songId).subscribe((res) => {
        this.currentSong.set(res[0]);
        console.log(this.currentSong());
      });
    });
    //
  }
}
