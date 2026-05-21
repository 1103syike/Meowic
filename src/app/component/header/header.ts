import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import { AuthService } from '../../@service/auth.service';
import { SearchStateService } from '../../@service/search-state.service';
import { Login } from '../login/login';
import { ProDialog } from '../pro-dialog/pro-dialog';

@Component({
  selector: 'app-header',
  imports: [Login, RouterLink, ProDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  public auth: AuthService = inject(AuthService);
  public searchState: SearchStateService = inject(SearchStateService);
  public userInfo = this.auth.getUserInfo();
  public isLoginDialogOpen = signal(false);
  public isProDialogOpen = signal(false);
  public selectedProPlan = signal('');

  openLoginDialog() {
    this.isLoginDialogOpen.set(true);
  }

  openProDialog() {
    this.isProDialogOpen.set(true);
  }

  selectProPlan(plan: { name: string }) {
    this.selectedProPlan.set(plan.name);
    Swal.fire({
      title: '已選擇方案',
      text: `你選擇了 Meowic Pro ${plan.name}，目前這只是展示流程。`,
      icon: 'success',
      timer: 1400,
      showConfirmButton: false,
    });
  }

  showAlert(title: string, icon: SweetAlertIcon, text: string) {
    Swal.fire({ title, text, icon });
  }

  logout() {
    this.showAlert('成功', 'success', '您已登出');
    this.auth.logout();
  }
}
