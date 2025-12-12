import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Intercept HTTP requests to include credentials (cookies)
   * and handle auth errors (401, 403)
   * Token is now in httpOnly cookie, sent automatically by browser when withCredentials is set
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Add withCredentials to send httpOnly cookies
    request = request.clone({
      withCredentials: true
    });

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.status === 401) {
          // Clear local auth state and redirect to login
          localStorage.removeItem('currentUser');
          localStorage.removeItem('mustChangePassword');
          this.router.navigate(['/login']);
        }

        // Handle 403 Forbidden - insufficient permissions
        if (error.status === 403) {
          console.error('Access denied');
        }

        return throwError(() => error);
      })
    );
  }
}
