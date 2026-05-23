import { Component, Input, inject, signal } from '@angular/core';
import { formatDisplayDate, SongType } from '../../../@service/api.service';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { NavigationContextService } from '../../../@service/navigation-context.service';
import { MusicPlayerService } from '../../../@service/music-player.service';

@Component({
  selector: 'app-lyric',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  templateUrl: './lyric.html',
  styleUrl: './lyric.scss',
})
export class Lyric {
  @Input() passedCurrentSong = signal<SongType | null>(null);
  private navigationContext: NavigationContextService = inject(NavigationContextService);
  public musicPlayer: MusicPlayerService = inject(MusicPlayerService);
  /////////////////////////////////////////////
  public isShowCover = signal<boolean>(true);
  /////////////////////////////////////////////

  ngOnInit() {

  }
  showCover(boolean: boolean) {
    this.isShowCover.set(boolean);
  }

  public backUrl(): string {
    const albumId = this.passedCurrentSong()?.album?.id;
    return this.navigationContext.getSongBackUrl(albumId ? `/album/${albumId}` : '/');
  }

  public releaseDate(song: SongType): string {
    return formatDisplayDate(song.releaseDate || song.album?.releaseDate);
  }

  public uploadedAt(song: SongType): string {
    return formatDisplayDate(song.uploadedAt);
  }
}
