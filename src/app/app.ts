import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
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
  private router: Router = inject(Router);
  public isCmsRoute = signal(false);
  /////////////////////////////////////////////

  ngOnInit() {
    this.setIsCmsRoute(this.router.url);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.setIsCmsRoute(event.urlAfterRedirects));
  }

  private setIsCmsRoute(url: string): void {
    this.isCmsRoute.set(url.startsWith('/cms'));
  }
}
