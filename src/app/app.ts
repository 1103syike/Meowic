import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toolbar } from './component/toolbar/toolbar';
import { PlaylistBar } from './component/musicbar/playlist-bar';
import { Header } from './component/header/header';
import { Player } from './component/player/player';
import { MusicPlayerService } from './@service/music-player.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Toolbar, PlaylistBar, Player],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('meowic');

  /////////////////////////////////////////////
  public player: MusicPlayerService = inject(MusicPlayerService);
  /////////////////////////////////////////////

  ngOnInit() {}
}
