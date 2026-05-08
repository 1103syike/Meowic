import Swal, { SweetAlertIcon } from 'sweetalert2';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Output,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { AuthService, LoginData } from '../../@service/auth.service';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  public closeOpenDialog = signal(false);
  @Output() close = new EventEmitter<void>();
  private auth: AuthService = inject(AuthService);
  public user = signal(null);
  loginForm = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
  });

  closingLoginDialog() {
    this.close.emit();
  }

  simpleAlert(title: string, icon: SweetAlertIcon, text: string) {
    Swal.fire({ title: title, text: text, icon: icon });
  }
  onLogin() {
    if (!this.loginForm.controls.email.value || !this.loginForm.controls.password.value) {
      this.simpleAlert('錯誤', 'error', '帳號或密碼不可為空');
    } else {
      this.auth.login(this.loginForm.value as LoginData).subscribe({
        next: (res) => {
          this.simpleAlert('歡迎', 'success', '登入成功');
          this.closingLoginDialog();
          this.auth.handleLoginSuccess(res.accessToken);
        },
        error: (err) => {
          this.simpleAlert('錯誤', 'error', '帳號或密碼錯誤');
        },
      });
    }
  }
}
