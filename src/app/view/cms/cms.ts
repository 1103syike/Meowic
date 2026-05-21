import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../@service/auth.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-cms',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatIconModule],
  templateUrl: './cms.html',
  styleUrl: './cms.scss',
})
export class Cms {
  public auth: AuthService = inject(AuthService);
}
