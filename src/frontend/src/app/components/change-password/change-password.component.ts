import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-md mx-auto mt-12">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h2 class="text-3xl font-bold text-center mb-8 text-gray-800">Change Password</h2>

        <div *ngIf="error" class="alert alert-error mb-6">{{ error }}</div>
        <div *ngIf="success" class="alert alert-success mb-6">{{ success }}</div>

        <form (ngSubmit)="submit()" class="space-y-6">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input 
              type="password" 
              name="current" 
              [(ngModel)]="form.current" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required />
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input 
              type="password" 
              name="next" 
              [(ngModel)]="form.next" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required 
              minlength="6" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input 
              type="password" 
              name="confirm" 
              [(ngModel)]="form.confirm" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required 
              minlength="6" />
          </div>
          <button 
            [disabled]="loading"
            class="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition">
            {{ loading ? 'Saving...' : 'Update Password' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class ChangePasswordComponent {
  form = { current: '', next: '', confirm: '' };
  loading = false;
  error = '';
  success = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (!this.form.current || !this.form.next || !this.form.confirm) {
      this.error = 'All fields are required';
      return;
    }
    if (this.form.next !== this.form.confirm) {
      this.error = 'New passwords do not match';
      return;
    }
    this.error = '';
    this.loading = true;

    this.auth.changePassword(this.form.current, this.form.next).subscribe({
      next: () => {
        this.auth.clearPasswordChangeRequirement();
        this.success = 'Password updated';
        setTimeout(() => this.router.navigate(['/search']), 800);
      },
      error: (err) => {
        this.error = err.error?.error?.message || 'Failed to change password';
        this.loading = false;
      }
    });
  }
}
