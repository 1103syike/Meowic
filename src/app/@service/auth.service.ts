import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { forkJoin, map } from 'rxjs';
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

  register(registerData: RegisterData) {
    return this.http.post<UserType>('http://localhost:3000/users', registerData);
  }

  getUserByIdentifier(identifier: string) {
    const value = identifier.trim();

    if (value.includes('@')) {
      return this.getUsersByParam({ email: value });
    }

    return forkJoin([this.getUsersByParam({ email: value }), this.getUsersByParam({ phone: value })]).pipe(
      map(([emailUsers, phoneUsers]) => [
        ...emailUsers,
        ...phoneUsers.filter((phoneUser) => !emailUsers.some((emailUser) => emailUser.id === phoneUser.id)),
      ]),
    );
  }

  resetPassword(userId: number, password: string) {
    return this.http.patch<UserType>(`http://localhost:3000/users/${userId}`, { password });
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
    const identifier = this.getTokenIdentifier();
    if (!identifier) return null;

    this.getUserByIdentifier(identifier).subscribe((res) => {
      this.user.set(res[0]);
    });

    return this.getUserByIdentifier(identifier);
  }

  canAccessCms(): boolean {
    const currentUser = this.user();
    return this.canUserAccessCms(currentUser) || this.isDefaultCmsAdmin(this.getTokenEmail());
  }

  canUserAccessCms(user: UserType | null | undefined): boolean {
    return !!user?.canAccessCms || user?.role === 'admin' || this.isDefaultCmsAdmin(user?.email);
  }

  getTokenEmail(): string | null {
    return this.getTokenPayloadValue('email');
  }

  getTokenIdentifier(): string | null {
    return this.getTokenPayloadValue('account') ?? this.getTokenPayloadValue('email') ?? this.getTokenPayloadValue('phone');
  }

  private getTokenPayloadValue(key: 'account' | 'email' | 'phone'): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedJson = atob(payload);
      return JSON.parse(decodedJson)[key] ?? null;
    } catch {
      return null;
    }
  }

  private isDefaultCmsAdmin(email: string | null | undefined): boolean {
    return !!email && this.cmsDefaultAdmins.has(email.trim().toLowerCase());
  }

  private getUsersByParam(params: Record<string, string>) {
    return this.http.get<UserType[]>('http://localhost:3000/users', { params });
  }
}

export interface LoginData {
  account?: string;
  email?: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  role: string;
  canAccessCms: boolean;
}
