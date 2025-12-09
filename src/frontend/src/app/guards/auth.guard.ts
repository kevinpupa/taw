import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Guard to protect routes that require authentication
   * Redirects to login if not authenticated
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated()) {
      if (this.authService.needsPasswordChange() && state.url !== '/change-password') {
        this.router.navigate(['/change-password']);
        return false;
      }
      return true;
    }

    // Redirect to login with return URL
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AirlineGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Guard to protect routes that require airline role
   */
  canActivate(): boolean {
    if (this.authService.isAirline()) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Guard to protect routes that require admin role
   */
  canActivate(): boolean {
    if (this.authService.hasRole('admin')) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}
