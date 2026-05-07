import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { ApiService } from '../../@service/api.service';
import { AuthService, LoginData, LoginResponse } from '../../@service/auth.service';
import { F } from '@angular/cdk/keycodes';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
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
  onLogin() {
    this.auth.login(this.loginForm.value as LoginData).subscribe({
      next: (res) => {
        this.closingLoginDialog();
        this.auth.handleLoginSuccess(res.accessToken);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
