import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toolbar } from "./component/toolbar/toolbar";
import { Musicbar } from "./component/musicbar/musicbar";
import { Header } from './component/header/header';
import { Player } from "./component/player/player";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Toolbar, Musicbar, Player],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('meowic');
}
