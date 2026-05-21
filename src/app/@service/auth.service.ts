import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { UserType } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http: HttpClient = inject(HttpClient);
  private readonly cmsDefaultAdmins = new Set(['dandy', 'wendy']);

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
    this.user.set(null);
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
    const email = this.getTokenEmail();
    if (!email) return null;

    this.getUserByEmail(email).subscribe((res) => {
      this.user.set(res[0]);
    });

    return this.getUserByEmail(email);
  }

  canAccessCms(): boolean {
    const currentUser = this.user();
    return this.canUserAccessCms(currentUser) || this.isDefaultCmsAdmin(this.getTokenEmail());
  }

  canUserAccessCms(user: UserType | null | undefined): boolean {
    return !!user?.canAccessCms || user?.role === 'admin' || this.isDefaultCmsAdmin(user?.email);
  }

  getTokenEmail(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedJson = atob(payload);
      return JSON.parse(decodedJson).email ?? null;
    } catch {
      return null;
    }
  }

  private isDefaultCmsAdmin(email: string | null | undefined): boolean {
    return !!email && this.cmsDefaultAdmins.has(email.trim().toLowerCase());
  }
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}
