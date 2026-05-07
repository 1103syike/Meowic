import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../@service/auth.service';
import { Login } from '../login/login';

@Component({
  selector: 'app-musicbar',
  imports: [MatIconModule, Login],
  templateUrl: './musicbar.html',
  styleUrl: './musicbar.scss',
  host: {
    class: 'musicbar', //
  },
})
export class Musicbar {
  public auth: AuthService = inject(AuthService);
  public isLoginDialogOpen = signal(false);

  openLoginDialog() {
    this.isLoginDialogOpen.set(true);
  }
  ngOnInit() {}
}
