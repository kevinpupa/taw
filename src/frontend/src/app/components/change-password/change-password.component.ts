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
    <div class="card" style="max-width: 420px; margin: 50px auto;">
      <h2>Change Password</h2>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>

      <form (ngSubmit)="submit()">
        <div>
          <label>Current Password</label>
          <input type="password" name="current" [(ngModel)]="form.current" required />
        </div>
        <div>
          <label>New Password</label>
          <input type="password" name="next" [(ngModel)]="form.next" required minlength="6" />
        </div>
        <div>
          <label>Confirm New Password</label>
          <input type="password" name="confirm" [(ngModel)]="form.confirm" required minlength="6" />
        </div>
        <button [disabled]="loading">{{ loading ? 'Saving...' : 'Update Password' }}</button>
      </form>
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
