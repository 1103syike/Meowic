import { Component, Input, inject, signal } from '@angular/core';
import { SongType } from '../../../@service/api.service';
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from '@angular/router';
import { NavigationContextService } from '../../../@service/navigation-context.service';

@Component({
  selector: 'app-lyric',
  imports: [MatIcon,RouterLink],
  templateUrl: './lyric.html',
  styleUrl: './lyric.scss',
})
export class Lyric {
  @Input() passedCurrentSong = signal<SongType | null>(null);
  private navigationContext: NavigationContextService = inject(NavigationContextService);
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
}
