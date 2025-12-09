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
    <div class="card" style="max-width: 400px; margin: 50px auto;">
      <h2>Login</h2>
      
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>
      
      <form (ngSubmit)="login()">
        <div>
          <label>Email:</label>
          <input type="email" [(ngModel)]="form.email" name="email" required>
        </div>
        
        <div>
          <label>Password:</label>
          <input type="password" [(ngModel)]="form.password" name="password" required>
        </div>
        
        <button [disabled]="loading">{{ loading ? 'Logging in...' : 'Login' }}</button>
      </form>
      
      <p>Don't have an account? <a routerLink="/register">Register here</a></p>
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
