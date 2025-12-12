import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface User {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  userType: string;
  mustChangePassword?: boolean;
}

interface AuthResponse {
  user: User;
  token: string;
  message?: string;
  mustChangePassword?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();
  
  private mustChangePasswordSubject = new BehaviorSubject<boolean>(false);
  public mustChangePassword$ = this.mustChangePasswordSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user from localStorage if exists (token is in httpOnly cookie)
    const savedUser = localStorage.getItem('currentUser');
    const savedMustChange = localStorage.getItem('mustChangePassword');
    
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
    if (savedMustChange) {
      this.mustChangePasswordSubject.next(savedMustChange === 'true');
    }
  }

  /**
   * Register a new passenger account
   * POST /api/auth/register
   */
  register(data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          this.setAuthData(response.user, undefined, false);
        })
      );
  }

  /**
   * Login user (passenger or airline)
   * POST /api/auth/login
   */
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setAuthData(response.user, undefined, response.mustChangePassword);
        })
      );
  }

  /**
   * Logout - clear tokens and user data
   */
  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('mustChangePassword');
        this.tokenSubject.next(null);
        this.currentUserSubject.next(null);
        this.mustChangePasswordSubject.next(false);
      })
    );
  }

  /**
   * Get current authenticated user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.tokenSubject.value;
  }
  
  /**
   * Check if user must change password (admin-invited airline first login)
   */
  needsPasswordChange(): boolean {
    return this.mustChangePasswordSubject.value === true;
  }

  clearPasswordChangeRequirement(): void {
    localStorage.setItem('mustChangePassword', 'false');
    this.mustChangePasswordSubject.next(false);
    const user = this.currentUserSubject.value;
    if (user) {
      this.currentUserSubject.next({ ...user, mustChangePassword: false });
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === role : false;
  }

  /**
   * Check if user is airline
   */
  isAirline(): boolean {
    const user = this.currentUserSubject.value;
    return user ? user.role === 'airline' : false;
  }

  /**
   * Set authentication data (user from response)
   */
  private setAuthData(user: User, token: string | undefined, mustChangePassword: boolean = false): void {
    // Token is now stored in httpOnly cookie by backend; we only store user data
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('mustChangePassword', mustChangePassword ? 'true' : 'false');
    this.currentUserSubject.next({ ...user, mustChangePassword });
    this.mustChangePasswordSubject.next(!!mustChangePassword);
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    });
  }
}
