import { Component, inject, signal } from '@angular/core';
import { MusicPlayerService } from '../../../@service/music-player.service';
import { SongType } from '../../../@service/api.service';

@Component({
  selector: 'app-artist',
  imports: [],
  templateUrl: './artist.html',
  styleUrl: './artist.scss',
})
export class Artist {
  /////////////////////////////////////////////
  private player: MusicPlayerService = inject(MusicPlayerService);
  /////////////////////////////////////////////
  public currentSong = signal<SongType | null>(null);
  /////////////////////////////////////////////

  ngOnInit() {
    this.player.getPlayer(localStorage.getItem('songId')!).subscribe((res) => {
      this.currentSong.set(res[0]);
    });
  }
}
