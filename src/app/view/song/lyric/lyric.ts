import { Component, Input, signal } from '@angular/core';
import { SongType } from '../../../@service/api.service';
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lyric',
  imports: [MatIcon,RouterLink],
  templateUrl: './lyric.html',
  styleUrl: './lyric.scss',
})
export class Lyric {
  @Input() passedCurrentSong = signal<SongType | null>(null);
  /////////////////////////////////////////////
  public isShowCover = signal<boolean>(true);
  /////////////////////////////////////////////

  ngOnInit() {

  }
  showCover(boolean: boolean) {
    this.isShowCover.set(boolean);
  }
}
