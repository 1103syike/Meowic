import { Component, ElementRef, ViewChild, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import Swal, { SweetAlertIcon } from 'sweetalert2';
import { AuthService } from '../../@service/auth.service';
import { SearchStateService } from '../../@service/search-state.service';
import { Login } from '../login/login';
import { ProDialog } from '../pro-dialog/pro-dialog';

@Component({
  selector: 'app-header',
  imports: [FormsModule, Login, MatIconModule, RouterLink, ProDialog],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

  public auth: AuthService = inject(AuthService);
  public searchState: SearchStateService = inject(SearchStateService);
  private router: Router = inject(Router);
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

  async openSearch() {
    this.searchState.openSearchFrom(this.router.url);

    if (!this.router.url.startsWith('/search')) {
      await this.router.navigateByUrl('/search');
    }

    requestAnimationFrame(() => this.searchInput?.nativeElement.focus());
  }

  updateSearch(query: string) {
    this.searchState.setQuery(query);
  }

  collapseSearchIfEmpty(): void {
    setTimeout(() => {
      if (!this.searchState.query().trim()) {
        const returnUrl = this.searchState.closeSearchAndGetReturnUrl();

        if (this.router.url.startsWith('/search')) {
          this.router.navigateByUrl(returnUrl);
        }
      }
    }, 120);
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
