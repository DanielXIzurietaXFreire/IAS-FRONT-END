import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url === 'http://localhost:5014/api/auth/login') {
      return next.handle(request);
    }

    const token = this.authService.getToken();
    if (!token) return next.handle(request);

    return next.handle(request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    }));
  }
}
