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
    <nav class="bg-sky-600 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold cursor-pointer" (click)="router.navigate(['/search'])">
            Flight Booking
          </h1>
          
          <!-- Menu -->
          <div class="flex gap-6 items-center flex-wrap justify-end">
            <ng-container *ngIf="(authService.currentUser$ | async) as user; else loginMenu">
              <a routerLink="/search" class="text-white hover:text-sky-100 transition">Search Flights</a>
              
              <div *ngIf="user.role === 'passenger'" class="flex gap-4">
                <a routerLink="/booking" class="text-white hover:text-sky-100 transition">Book Flight</a>
                <a routerLink="/my-tickets" class="text-white hover:text-sky-100 transition">My Tickets</a>
              </div>
              
              <div *ngIf="user.role === 'airline'" class="flex gap-4">
                <a routerLink="/airline/dashboard" class="text-white hover:text-sky-100 transition">Dashboard</a>
                <a routerLink="/airline/routes" class="text-white hover:text-sky-100 transition">Routes</a>
                <a routerLink="/airline/aircraft" class="text-white hover:text-sky-100 transition">Aircraft</a>
                <a routerLink="/airline/flights" class="text-white hover:text-sky-100 transition">Flights</a>
                <a routerLink="/airline/statistics" class="text-white hover:text-sky-100 transition">Statistics</a>
              </div>

              <div *ngIf="user.role === 'admin'" class="flex gap-4">
                <a routerLink="/admin/users" class="text-white hover:text-sky-100 transition">Users</a>
                <a routerLink="/admin/airlines" class="text-white hover:text-sky-100 transition">Airlines</a>
              </div>

              <span class="text-sm text-sky-100">{{ user.fullName }}</span>
              <button (click)="logout()" class="bg-red-500 hover:bg-red-600 px-3 py-2 rounded transition">Logout</button>
            </ng-container>

            <ng-template #loginMenu>
              <a routerLink="/login" class="text-white hover:text-sky-100 transition">Login</a>
              <a routerLink="/register" class="text-white hover:text-sky-100 transition">Register</a>
            </ng-template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 py-6">
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


