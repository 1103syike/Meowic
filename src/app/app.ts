import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toolbar } from './component/toolbar/toolbar';
import { Musicbar } from './component/musicbar/musicbar';
import { Header } from './component/header/header';
import { Player } from './component/player/player';
import { MusicPlayerService } from './@service/music-player.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Toolbar, Musicbar, Player],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('meowic');

  /////////////////////////////////////////////
  public isClose = signal<boolean>(false);
  /////////////////////////////////////////////
  public player: MusicPlayerService = inject(MusicPlayerService);
  /////////////////////////////////////////////

  ngOnInit() {

  }
}
