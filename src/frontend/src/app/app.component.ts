import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <!-- Navbar -->
    <nav style="background-color: #1e293b; color: white; padding: 1rem 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center;">
      <h1 style="font-size: 1.875rem; font-weight: bold; cursor: pointer; margin: 0;" (click)="router.navigate(['/search'])">✈️ Flight Booking</h1>
      
      <!-- Hamburger Menu Button -->
      <button (click)="menuOpen = !menuOpen" style="background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; z-index: 50;">
        {{ menuOpen ? '✕' : '☰' }}
      </button>
    </nav>

    <!-- Side Menu -->
    <div *ngIf="menuOpen" 
         (click)="menuOpen = false"
         style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.5); z-index: 40;"></div>
    
    <div [style.transform]="menuOpen ? 'translateX(0)' : 'translateX(100%)'"
         style="position: fixed; top: 0; right: 0; width: 300px; height: 100vh; background-color: #1e293b; color: white; z-index: 45; transition: transform 0.3s ease-in-out; overflow-y: auto; box-shadow: -2px 0 10px rgba(0,0,0,0.3);">
      
      <div style="padding: 2rem 1.5rem;">
        <!-- Close Button -->
        <button (click)="menuOpen = false" style="background: transparent; border: none; color: white; font-size: 1.5rem; cursor: pointer; position: absolute; top: 1rem; right: 1rem;">
          ✕
        </button>

        <!-- Menu Items -->
        <div style="margin-top: 2rem;">
          <ng-container *ngIf="(authService.currentUser$ | async) as user; else loginMenu">
            <!-- Greeting -->
            <div style="padding: 1rem 0; border-bottom: 1px solid #475569; margin-bottom: 1rem;">
              <p style="margin: 0; font-size: 0.875rem; color: #cbd5e1;">Logged in as</p>
              <p style="margin: 0; font-weight: bold;">{{ user.fullName }}</p>
            </div>

            <!-- Search -->
            <a routerLink="/search" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
              🔍 Search Flights
            </a>

            <!-- Passenger Menu -->
            <div *ngIf="user.role === 'passenger'">
              <a routerLink="/booking" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                🎫 Book Flight
              </a>
              <a routerLink="/my-tickets" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                🎟️ My Tickets
              </a>
            </div>

            <!-- Airline Menu -->
            <div *ngIf="user.role === 'airline'">
              <p style="margin: 1rem 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Airline Management</p>
              <a routerLink="/airline/dashboard" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                📊 Dashboard
              </a>
              <a routerLink="/airline/routes" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                📍 Manage Routes
              </a>
              <a routerLink="/airline/aircraft" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                ✈️ Manage Aircraft
              </a>
              <a routerLink="/airline/flights" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                🛫 Manage Flights
              </a>
              <a routerLink="/airline/statistics" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                📈 Statistics
              </a>
            </div>

            <!-- Admin Menu -->
            <div *ngIf="user.role === 'admin'">
              <p style="margin: 1rem 0 0.5rem 0; font-size: 0.875rem; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Admin Panel</p>
              <a routerLink="/admin/users" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                👥 Manage Users
              </a>
              <a routerLink="/admin/airlines" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
                🏢 Manage Airlines
              </a>
            </div>

            <!-- Logout -->
            <button (click)="logout()" style="display: block; width: 100%; padding: 0.75rem 0; margin-top: 2rem; background-color: #dc2626; color: white; border: none; cursor: pointer; font-weight: 500; border-radius: 0.375rem;">
              🚪 Logout
            </button>
          </ng-container>

          <ng-template #loginMenu>
            <a routerLink="/login" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
              🔐 Login
            </a>
            <a routerLink="/register" (click)="menuOpen = false" style="display: block; padding: 0.75rem 0; color: white; text-decoration: none; cursor: pointer; border-bottom: 1px solid #334155;">
              📝 Register
            </a>
          </ng-template>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div style="max-width: 1280px; margin: 0 auto; padding: 0 1rem; margin-top: 1.5rem;">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  menuOpen = false;

  constructor(
    public authService: AuthService,
    public router: Router
  ) {}

  ngOnInit() {
    // Initialize auth state from localStorage
  }

  logout() {
    this.menuOpen = false;
    this.authService.logout();
    this.router.navigate(['/search']);
  }
}


