import { inject, Injectable, signal } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { firstValueFrom, forkJoin, from, map, Observable, of, switchMap, tap } from 'rxjs';
import { UserType } from './api.service';
import { displayLoginId, toAuthEmail } from './firebase/firebase-auth.util';
import { getFirebaseAuth, getFirebaseFirestore } from './firebase/firebase.app';
import { FirestoreDataService } from './firebase/firestore-data.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly data = inject(FirestoreDataService);
  private readonly auth = getFirebaseAuth();
  private readonly db = getFirebaseFirestore();
  private readonly cmsDefaultAdmins = new Set(['dandy', 'wendy']);
  private readonly authReady = this.auth.authStateReady();

  public currentUserStatus = signal<boolean>(false);
  public user = signal<UserType | null>(null);

  constructor() {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      this.currentUserStatus.set(!!firebaseUser);
      if (firebaseUser) {
        this.loadUserProfile(firebaseUser).subscribe((profile) => this.user.set(profile));
      } else {
        this.user.set(null);
      }
    });
  }

  login(loginData: LoginData): Observable<LoginResponse> {
    const identifier = (loginData.account || loginData.email || '').trim();
    const authEmail = toAuthEmail(identifier);
    return from(
      signInWithEmailAndPassword(this.auth, authEmail, loginData.password).then(async (cred) => ({
        accessToken: await cred.user.getIdToken(),
      })),
    );
  }

  register(registerData: RegisterData): Observable<UserType> {
    const contact =
      registerData.email?.trim() || registerData.phone?.trim() || '';
    const authEmail = registerData.email?.trim()
      ? toAuthEmail(registerData.email)
      : registerData.phone?.trim()
        ? toAuthEmail(registerData.phone)
        : '';

    if (!authEmail) {
      throw new Error('請提供信箱或手機');
    }

    return from(
      createUserWithEmailAndPassword(this.auth, authEmail, registerData.password).then(
        async (cred) => {
          const allUsers = await firstValueFrom(this.data.getAllUsers());
          const id = allUsers.reduce((max, user) => Math.max(max, user.id), 0) + 1;

          const profile: UserType = {
            id,
            name: registerData.name,
            email: registerData.email?.trim() || displayLoginId(authEmail),
            phone: registerData.phone?.trim(),
            password: '',
            role: registerData.role,
            canAccessCms: registerData.canAccessCms,
            authEmail,
            authUid: cred.user.uid,
          };

          await setDoc(doc(this.db, 'users', String(id)), profile);
          return profile;
        },
      ),
    );
  }

  getUserByIdentifier(identifier: string) {
    const value = identifier.trim();

    if (value.includes('@')) {
      return this.data.findUsersByEmail(value);
    }

    return forkJoin([
      this.data.findUsersByEmail(value),
      this.data.findUsersByPhone(value),
    ]).pipe(
      map(([emailUsers, phoneUsers]) => [
        ...emailUsers,
        ...phoneUsers.filter(
          (phoneUser) => !emailUsers.some((emailUser) => emailUser.id === phoneUser.id),
        ),
      ]),
    );
  }

  resetPassword(userId: number, password: string) {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      return from(Promise.reject(new Error('請先登入')));
    }
    return from(updatePassword(firebaseUser, password)).pipe(
      switchMap(() => this.data.updateUser(userId, { password: '' })),
    );
  }

  sendPasswordReset(contact: string): Observable<void> {
    const authEmail = toAuthEmail(contact);
    return from(sendPasswordResetEmail(this.auth, authEmail));
  }

  handleLoginSuccess(token: string) {
    localStorage.setItem('token', token);
    this.currentUserStatus.set(true);
    const firebaseUser = this.auth.currentUser;
    if (firebaseUser) {
      this.loadUserProfile(firebaseUser).subscribe((profile) => this.user.set(profile));
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    signOut(this.auth);
    this.currentUserStatus.set(false);
    this.user.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** 等 Firebase 還原登入狀態（新分頁／重新整理時必要） */
  waitForAuthReady(): Promise<void> {
    return this.authReady;
  }

  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }

  getUserByEmail(email: string) {
    return this.data.findUsersByEmail(email);
  }

  getUserInfo(): Observable<UserType[]> | null {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) {
      return null;
    }
    return this.loadUserProfile(firebaseUser).pipe(
      map((profile) => (profile ? [profile] : [])),
      tap((profiles) => {
        if (profiles[0]) {
          this.user.set(profiles[0]);
        }
      }),
    );
  }

  canAccessCms(): boolean {
    const currentUser = this.user();
    return (
      this.canUserAccessCms(currentUser) ||
      this.isDefaultCmsAdmin(currentUser?.email ?? displayLoginId(this.auth.currentUser?.email))
    );
  }

  canUserAccessCms(user: UserType | null | undefined): boolean {
    return !!user?.canAccessCms || user?.role === 'admin' || this.isDefaultCmsAdmin(user?.email);
  }

  getTokenEmail(): string | null {
    return this.user()?.email ?? this.auth.currentUser?.email ?? null;
  }

  getTokenIdentifier(): string | null {
    const profile = this.user();
    if (profile?.email) {
      return profile.email;
    }
    if (profile?.phone) {
      return profile.phone;
    }
    return displayLoginId(this.auth.currentUser?.email ?? null);
  }

  private loadUserProfile(firebaseUser: User): Observable<UserType | null> {
    const authEmail = firebaseUser.email ?? '';
    return this.data.findUserByAuthEmail(authEmail).pipe(
      switchMap((byAuthEmail) => {
        if (byAuthEmail) {
          return of(byAuthEmail);
        }
        const loginId = displayLoginId(authEmail);
        return this.data.findUsersByEmail(loginId).pipe(map((rows) => rows[0] ?? null));
      }),
      tap(async (profile) => {
        if (profile && firebaseUser) {
          localStorage.setItem('token', await firebaseUser.getIdToken());
        }
      }),
    );
  }

  private isDefaultCmsAdmin(email: string | null | undefined): boolean {
    return !!email && this.cmsDefaultAdmins.has(email.trim().toLowerCase());
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
