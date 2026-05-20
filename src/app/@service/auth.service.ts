import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { UserType } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http: HttpClient = inject(HttpClient);

  public currentUserStatus = signal<boolean>(!!localStorage.getItem('token'));
  public user = signal<UserType | null>(null);

  login(loginData: LoginData) {
    return this.http.post<LoginResponse>('http://localhost:3000/login', loginData);
  }

  handleLoginSuccess(token: string) {
    localStorage.setItem('token', token);
    this.currentUserStatus.set(true);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUserStatus.set(false);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserByEmail(email: string) {
    return this.http.get<UserType[]>('http://localhost:3000/users', {
      params: { email },
    });
  }

  getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const payload = token.split('.')[1];
    const decodedJson = atob(payload);
    const email = JSON.parse(decodedJson).email;

    this.getUserByEmail(email).subscribe((res) => {
      this.user.set(res[0]);
    });

    return this.getUserByEmail(email);
  }
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}
