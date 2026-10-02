import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, GoogleLoginResponse, LoginResponse } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'ktx_access_token';
  private readonly USER_KEY = 'ktx_user_profile';

  currentUser = signal<AuthUser | null>(null);
  token = signal<string | null>(null);

  isLoggedIn = computed(() => !!this.currentUser());
  isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  isStudent = computed(() => this.currentUser()?.role === 'STUDENT');

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const savedToken = localStorage.getItem(this.TOKEN_KEY);
      const savedUserStr = localStorage.getItem(this.USER_KEY);

      if (savedToken && savedUserStr) {
        this.token.set(savedToken);
        this.currentUser.set(JSON.parse(savedUserStr));
      }
    } catch (e) {
      console.warn('[AuthService] Could not parse stored user profile', e);
      this.clearStorage();
    }
  }

  login(identifier: string, password: string): Observable<AuthUser> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { identifier, password }).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw new Error(res.message || 'Đăng nhập không thành công');
        }
        return res.data;
      }),
      tap(({ token, user }) => this.persistSession(token, user)),
      map(({ user }) => user),
      catchError((error) => {
        console.error('[AuthService.login Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.'));
      })
    );
  }

  googleLogin(idToken: string): Observable<AuthUser> {
    return this.http.post<GoogleLoginResponse>(`${this.apiUrl}/google-login`, { idToken }).pipe(
      map((res) => {
        const session = res.data ?? (res.token && res.user ? { token: res.token, user: res.user } : null);
        if (!res.success || !session) {
          throw new Error(res.message || 'Đăng nhập Google không thành công');
        }
        return session;
      }),
      tap(({ token, user }) => this.persistSession(token, user)),
      map(({ user }) => user),
      catchError((error) => {
        console.error('[AuthService.googleLogin Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể đăng nhập bằng Google ICTU.'));
      })
    );
  }

  logout(redirectUrl = '/login'): void {
    this.clearStorage();
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigateByUrl(redirectUrl);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<string> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/change-password`,
      { currentPassword, newPassword }
    ).pipe(
      map((res) => res.message),
      catchError((error) => {
        console.error('[AuthService.changePassword Error]', error);
        return throwError(() => new Error(error.error?.message || 'Đổi mật khẩu thất bại.'));
      })
    );
  }

  forgotPassword(emailOrStudentCode: string): Observable<string> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/forgot-password`,
      { emailOrStudentCode }
    ).pipe(
      map((res) => res.message),
      catchError((error) => {
        console.error('[AuthService.forgotPassword Error]', error);
        return throwError(() => new Error(error.error?.message || 'Khôi phục mật khẩu thất bại.'));
      })
    );
  }

  getAuthorizationHeader(): string | null {
    const t = this.token();
    return t ? `Bearer ${t}` : null;
  }

  private clearStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

  private persistSession(token: string, user: AuthUser): void {
    this.token.set(token);
    this.currentUser.set(user);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }
}
