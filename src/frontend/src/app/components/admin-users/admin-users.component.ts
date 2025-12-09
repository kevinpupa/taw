import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AirlineService } from '../../services/airline.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2>User Management</h2>
      
      <div *ngIf="loading" class="alert alert-info">Loading users...</div>
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      
      <div *ngIf="!loading && users.length > 0">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Role</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.fullName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.userType }}</td>
              <td>{{ user.role }}</td>
              <td>{{ user.isActive ? 'Active' : 'Inactive' }}</td>
              <td>
                <button *ngIf="user.isActive" 
                        (click)="deleteUser(user._id)" 
                        class="danger"
                        [disabled]="deletingId === user._id">
                  {{ deletingId === user._id ? 'Deleting...' : 'Delete' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div *ngIf="!loading && users.length === 0" class="empty-state">
        <p>No users found</p>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  loading = true;
  error = '';
  deletingId = '';

  constructor(private airlineService: AirlineService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.airlineService.getUsers().subscribe({
      next: (response: any) => {
        this.users = response.users || response;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load users';
        this.loading = false;
      }
    });
  }

  deleteUser(userId: string): void {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.deletingId = userId;

    this.airlineService.deleteUser(userId).subscribe({
      next: () => {
        alert('User deleted successfully');
        this.loadUsers();
        this.deletingId = '';
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to delete user';
        this.deletingId = '';
      }
    });
  }
}
