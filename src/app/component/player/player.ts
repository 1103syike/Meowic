import { Component, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-player',
  imports: [MatIcon],
  templateUrl: './player.html',
  styleUrl: './player.scss',
})
export class Player {
  public isClose = signal<boolean>(false);
  closePlayer(boolean: boolean) {
    this.isClose.set(boolean);
  }
}
