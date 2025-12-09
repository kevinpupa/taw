import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="card" style="max-width: 400px; margin: 50px auto;">
      <h2>Register</h2>
      
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>
      
      <form (ngSubmit)="register()">
        <div>
          <label>Full Name:</label>
          <input type="text" [(ngModel)]="form.fullName" name="fullName" required>
        </div>
        
        <div>
          <label>Email:</label>
          <input type="email" [(ngModel)]="form.email" name="email" required>
        </div>
        
        <div>
          <label>Password:</label>
          <input type="password" [(ngModel)]="form.password" name="password" required>
        </div>
        
        <div>
          <label>Phone (optional):</label>
          <input type="text" [(ngModel)]="form.phone" name="phone">
        </div>
        
        <button [disabled]="loading">{{ loading ? 'Registering...' : 'Register' }}</button>
      </form>
      
      <p>Already have an account? <a routerLink="/login">Login here</a></p>
    </div>
  `
})
export class RegisterComponent {
  form = { fullName: '', email: '', password: '', phone: '' };
  loading = false;
  error = '';
  success = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  register() {
    if (!this.form.fullName || !this.form.email || !this.form.password) {
      this.error = 'Full name, email, and password required';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register(this.form).subscribe({
      next: () => {
        this.success = 'Registration successful! Redirecting to search...';
        setTimeout(() => this.router.navigate(['/search']), 1000);
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}
