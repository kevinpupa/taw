import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <h2 class="text-4xl font-bold text-center mb-2 text-sky-900">Welcome Back</h2>
          <p class="text-center text-gray-500 mb-8">Sign in to your Flight Booking account</p>
          
          <div *ngIf="error" class="alert alert-error mb-6 rounded-lg border border-red-200">{{ error }}</div>
          <div *ngIf="success" class="alert alert-success mb-6 rounded-lg border border-green-200">{{ success }}</div>
          
          <form (ngSubmit)="login()" class="space-y-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input 
                type="email" 
                [(ngModel)]="form.email" 
                name="email"
                placeholder="you@example.com"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                required>
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                [(ngModel)]="form.password" 
                name="password"
                placeholder="Enter your password"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                required>
            </div>
            
            <button 
              [disabled]="loading"
              class="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition transform hover:scale-105">
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
          
          <div class="mt-8 pt-8 border-t border-gray-200">
            <p class="text-center text-gray-600">
              Don't have an account? 
              <a routerLink="/register" class="text-sky-600 hover:text-sky-700 font-semibold hover:underline">Create one</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  form = { email: '', password: '' };
  loading = false;
  error = '';
  success = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login() {
    if (!this.form.email || !this.form.password) {
      this.error = 'Email and password required';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.form.email, this.form.password).subscribe({
      next: (response) => {
        this.success = 'Login successful! Redirecting...';
        const target = this.authService.needsPasswordChange() ? '/change-password' : '/search';
        setTimeout(() => this.router.navigate([target]), 800);
      },
      error: (err) => {
        this.error = err.error?.error?.message || 'Login failed';
        this.loading = false;
      }
    });
  }
}
