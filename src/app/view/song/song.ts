import { Component, effect, inject, signal } from '@angular/core';
import { Lyric } from './lyric/lyric';
import { Artist } from './artist/artist';
import { SongType } from '../../@service/api.service';
import { ActivatedRoute } from '@angular/router';
import { MusicPlayerService } from '../../@service/music-player.service';
import { PlaybackQueueService } from '../../@service/playback-queue.service';

@Component({
  selector: 'app-song',
  imports: [Lyric, Artist],
  templateUrl: './song.html',
  styleUrl: './song.scss',
})
export class Song {
  /////////////////////////////////////////////
  private route: ActivatedRoute = inject(ActivatedRoute);
  private player: MusicPlayerService = inject(MusicPlayerService);
  private playbackQueue: PlaybackQueueService = inject(PlaybackQueueService);
  /////////////////////////////////////////////
  public currentSong = signal<SongType | null>(null);
  /////////////////////////////////////////////

  constructor() {
    effect(() => {
      const songId = this.playbackQueue.currentSongId();
      if (!songId) {
        return;
      }

      this.loadSong(songId.toString());
    });
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const songId = params.get('id') ?? localStorage.getItem('songId');
      if (!songId) {
        return;
      }

      this.player.setPlayer(songId);
      this.loadSong(songId);
    });
  }

  private loadSong(songId: string): void {
    this.player.getPlayer(songId).subscribe((res) => {
      const song = res[0];
      this.currentSong.set(song);
      this.loadSongLength(song);
    });
  }

  private loadSongLength(song: SongType): void {
    if (song.length && song.length !== '--:--') {
      return;
    }

    const audio = new Audio(song.audioPath);

    audio.onloadedmetadata = () => {
      this.currentSong.set({
        ...song,
        length: this.formatTime(audio.duration),
      });
    };

    audio.onerror = () => {
      this.currentSong.set({
        ...song,
        length: '--:--',
      });
    };
  }

  private formatTime(time: number): string {
    if (!Number.isFinite(time)) {
      return '--:--';
    }

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
}
