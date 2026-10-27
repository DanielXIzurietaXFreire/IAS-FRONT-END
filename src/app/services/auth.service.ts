import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  token: string;
  user?: { name?: string; nombre?: string; email?: string };
  usuario?: { name?: string; nombre?: string; email?: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:5014/api/auth/login';
  private readonly tokenKey = 'token';
  private readonly userKey = 'user';

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { email, password }).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        if (response.user || response.usuario) {
          localStorage.setItem(this.userKey, JSON.stringify(response.user || response.usuario));
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(this.tokenKey));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserName(): string {
    const storedUser = localStorage.getItem(this.userKey);
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as { name?: string; nombre?: string; email?: string };
        return user.name || user.nombre || user.email || 'usuario';
      } catch {
        return 'usuario';
      }
    }

    const token = this.getToken();
    if (!token) return 'usuario';
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, string>;
      return payload['name'] || payload['nombre'] || payload['unique_name'] || payload['email'] || 'usuario';
    } catch {
      return 'usuario';
    }
  }
}
