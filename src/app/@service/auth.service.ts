import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //////////////////////////////////////////////////////
  private http: HttpClient = inject(HttpClient);
  private apiService: ApiService = inject(ApiService);
  //////////////////////////////////////////////////////
  // 即時判斷是否登入
  public currentUserStatus = signal<boolean>(!!localStorage.getItem('token'));
  public user = signal<any>(null);
  //////////////////////////////////////////////////////

  // 登入
  login(loginData: LoginData) {
    return this.http.post<LoginResponse>('http://localhost:3000/login', loginData);
  }
  // 這裡處理登入成功
  handleLoginSuccess(token: string) {
    localStorage.setItem('token', token);
    this.currentUserStatus.set(true);
  }

  // 登出
  logout(): void {
    localStorage.removeItem('token');
    this.currentUserStatus.set(false);
  }
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * 取得目前的 Token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserByEmail(email: string) {
    const options = {
      params: { email: email },
    };
    return this.http.get<any[]>('http://localhost:3000/users', options);
  }
  /**
   * 取得 user 資料
   */
  getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = token.split('.')[1];
    const decodedJson = atob(payload);
    this.getUserByEmail(JSON.parse(decodedJson).email).subscribe((res) => {
      this.user.set(res[0]);
    });
    return this.getUserByEmail(JSON.parse(decodedJson).email);
  }
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}
