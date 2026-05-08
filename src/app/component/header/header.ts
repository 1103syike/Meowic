import { Component, signal, inject } from '@angular/core';
import { AuthService } from '../../@service/auth.service';
import { Login } from '../login/login';
import Swal, { SweetAlertIcon } from 'sweetalert2';

@Component({
  selector: 'app-header',
  imports: [Login],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  public auth: AuthService = inject(AuthService);
  public isLoggin = this.auth.isLoggedIn();
  public userInfo = this.auth.getUserInfo();
  public isLoginDialogOpen = signal(false);

  openLoginDialog() {
    this.isLoginDialogOpen.set(true);
  }

  simpleAlert(title: string, icon: SweetAlertIcon, text: string) {
    Swal.fire({ title: title, text: text, icon: icon });
  }
  logout() {
    this.simpleAlert('成功', 'success', '您已登出');
    this.auth.logout();
  }
}
