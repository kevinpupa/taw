import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AirlineService } from '../../services/airline.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div class="max-w-7xl mx-auto">
        <div class="mb-10">
          <h1 class="text-5xl font-bold text-gray-900 mb-2">User Management</h1>
          <p class="text-gray-600 text-lg">Monitor and manage all user accounts</p>
        </div>

        <div *ngIf="loading" class="bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-200">
          <div class="animate-spin text-4xl mb-4">⏳</div>
          <p class="text-gray-600 text-lg">Loading users...</p>
        </div>

        <div *ngIf="error && !loading" class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span class="text-2xl">⚠️</span>
          <div><p class="font-semibold text-red-900">Error</p><p class="text-red-700">{{ error }}</p></div>
        </div>

        <div *ngIf="!loading && users.length > 0" class="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          <div class="p-8 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">All Users</h2>
              <p class="text-gray-600 text-sm mt-1">{{ users.length }} user{{ users.length !== 1 ? 's' : '' }} total</p>
            </div>
            <div class="bg-sky-100 text-sky-700 px-4 py-2 rounded-lg font-bold text-lg">{{ users.length }}</div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th class="px-8 py-4 text-left text-sm font-semibold text-gray-700">Full Name</th>
                  <th class="px-8 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th class="px-8 py-4 text-center text-sm font-semibold text-gray-700">Role</th>
                  <th class="px-8 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                  <th class="px-8 py-4 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr *ngFor="let user of users" class="hover:bg-slate-50 transition">
                  <td class="px-8 py-4 text-gray-900 font-medium">{{ user.fullName }}</td>
                  <td class="px-8 py-4 text-gray-600">{{ user.email }}</td>
                  <td class="px-8 py-4 text-center">
                    <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold" [ngClass]="getRoleClass(user.role)">{{ formatRole(user.role) }}</span>
                  </td>
                  <td class="px-8 py-4 text-center">
                    <span *ngIf="user.isActive" class="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold">🟢 Active</span>
                    <span *ngIf="!user.isActive" class="inline-block bg-gray-100 text-gray-700 px-4 py-1 rounded-full text-sm font-semibold">⚪ Inactive</span>
                  </td>
                  <td class="px-8 py-4 text-center">
                    <button *ngIf="user.isActive" (click)="deleteUser(user._id)" [disabled]="deletingId === user._id" class="inline-flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ deletingId === user._id ? '⏳ Deleting...' : '🗑️ Delete' }}
                    </button>
                    <span *ngIf="!user.isActive" class="text-gray-400 text-sm">N/A</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div *ngIf="!loading && users.length === 0" class="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
          <div class="text-6xl mb-4">👥</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">No Users Found</h3>
          <p class="text-gray-600">Users will appear here once they register</p>
        </div>
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

  formatRole(role: string): string {
    const roleMap: { [key: string]: string } = {
      'admin': '👨‍💼 Admin',
      'airline': '✈️ Airline',
      'airline_admin': '✈️ Airline Admin',
      'passenger': '👤 Passenger'
    };
    return roleMap[role] || role;
  }

  getRoleClass(role: string): string {
    const classMap: { [key: string]: string } = {
      'admin': 'bg-red-100 text-red-700',
      'airline': 'bg-orange-100 text-orange-700',
      'airline_admin': 'bg-orange-100 text-orange-700',
      'passenger': 'bg-blue-100 text-blue-700'
    };
    return classMap[role] || 'bg-gray-100 text-gray-700';
  }
}
