import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse } from '../../../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/auth';

  private readonly tokenKey = 'cm_jwt_token';
  private readonly roleKey = 'cm_user_role';
  private readonly usernameKey = 'cm_username';

  currentRole = signal<string | null>(this.readStorage(this.roleKey));
  currentUsername = signal<string | null>(this.readStorage(this.usernameKey));

  login(credentials: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap((res) => {
        this.writeStorage(this.tokenKey, res.token);
        this.writeStorage(this.roleKey, res.role);
        this.writeStorage(this.usernameKey, credentials.username);
        this.currentRole.set(res.role);
        this.currentUsername.set(credentials.username);
      })
    );
  }

  logout(): void {
    this.removeStorage(this.tokenKey);
    this.removeStorage(this.roleKey);
    this.removeStorage(this.usernameKey);
    this.currentRole.set(null);
    this.currentUsername.set(null);
  }

  getToken(): string | null {
    return this.readStorage(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private readStorage(key: string): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(key);
  }

  private writeStorage(key: string, value: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(key, value);
  }

  private removeStorage(key: string): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(key);
  }
}