import { Component, inject, signal } from '@angular/core';
import { Lyric } from './lyric/lyric';
import { Artist } from './artist/artist';
import { ApiService, SongType } from '../../@service/api.service';
import { ActivatedRoute } from '@angular/router';
import { MusicPlayerService } from '../../@service/music-player.service';

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
  private player: MusicPlayerService = inject(MusicPlayerService);
  /////////////////////////////////////////////
  public currentSong = signal<SongType | null>(null);
  /////////////////////////////////////////////

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const songId = params.get('id') ?? localStorage.getItem('songId');
      if (!songId) {
        return;
      }

      this.player.setPlayer(songId);
      this.player.getPlayer(songId).subscribe((res) => {
        this.currentSong.set(res[0]);
      });
    });
  }
}
