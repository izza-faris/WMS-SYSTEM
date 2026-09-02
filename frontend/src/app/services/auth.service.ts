import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, AuthResponse, UserProfile } from '../models/auth.models';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'wms_auth_token';
  private readonly USER_KEY = 'wms_auth_user';

  currentUser = signal<AuthResponse | null>(this.getStoredUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  registerClient(data: any): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.apiUrl}/register-client`, data);
  }

  getMe(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${this.apiUrl}/me`);
  }

  private setSession(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData));
    this.currentUser.set(authData);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private getStoredUser(): AuthResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
