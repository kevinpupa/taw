import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AirlineService } from '../../services/airline.service';

@Component({
  selector: 'app-admin-airlines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div class="max-w-7xl mx-auto">
        <div class="mb-10">
          <h1 class="text-5xl font-bold text-gray-900 mb-2">Airline Management</h1>
          <p class="text-gray-600 text-lg">Create and manage airline accounts</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div class="lg:col-span-2">
            <form (ngSubmit)="createAirline()" class="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
              <h2 class="text-2xl font-bold text-gray-900 mb-6">Create New Airline</h2>
              <div class="space-y-5">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">Airline Name *</label>
                  <input type="text" [(ngModel)]="newAirline.name" name="name" placeholder="e.g., SkyWings Airlines" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition">
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Airline Code *</label>
                    <input type="text" [(ngModel)]="newAirline.code" name="code" placeholder="e.g., SK" maxlength="3" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition uppercase">
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input type="email" [(ngModel)]="newAirline.email" name="email" placeholder="admin@airline.com" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition">
                  </div>
                </div>
              </div>
              <button [disabled]="loading" class="mt-8 w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                <span *ngIf="!loading" class="flex items-center justify-center gap-2">✈️ Create Airline</span>
                <span *ngIf="loading">Creating...</span>
              </button>
            </form>
          </div>
          <div class="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 h-fit">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Summary</h3>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-gray-600">Total Airlines:</span>
                <span class="text-3xl font-bold text-sky-600">{{ airlines.length }}</span>
              </div>
              <div class="pt-3 border-t border-gray-200">
                <p class="text-sm text-gray-500">Active airlines can manage flights and routes.</p>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="error" class="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <span class="text-2xl">⚠️</span>
          <div><p class="font-semibold text-red-900">Error</p><p class="text-red-700">{{ error }}</p></div>
        </div>
        <div *ngIf="success" class="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <span class="text-2xl">✓</span>
          <div><p class="font-semibold text-green-900">Success</p><p class="text-green-700">{{ success }}</p></div>
        </div>

        <div *ngIf="airlines.length > 0" class="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          <div class="p-8 border-b border-slate-200">
            <h2 class="text-2xl font-bold text-gray-900">Registered Airlines</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <tr>
                  <th class="px-8 py-4 text-left text-sm font-semibold text-gray-700">Airline Name</th>
                  <th class="px-8 py-4 text-left text-sm font-semibold text-gray-700">Code</th>
                  <th class="px-8 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th class="px-8 py-4 text-center text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr *ngFor="let airline of airlines" class="hover:bg-slate-50 transition">
                  <td class="px-8 py-4 text-gray-900 font-medium">{{ airline.name }}</td>
                  <td class="px-8 py-4"><span class="inline-block bg-sky-100 text-sky-700 px-3 py-1 rounded-full text-sm font-semibold">{{ airline.code }}</span></td>
                  <td class="px-8 py-4 text-gray-600">{{ airline.email }}</td>
                  <td class="px-8 py-4 text-center">
                    <span *ngIf="airline.isActive" class="inline-block bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold">🟢 Active</span>
                    <span *ngIf="!airline.isActive" class="inline-block bg-gray-100 text-gray-700 px-4 py-1 rounded-full text-sm font-semibold">⚪ Inactive</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div *ngIf="!loading && airlines.length === 0" class="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
          <div class="text-6xl mb-4">✈️</div>
          <h3 class="text-2xl font-bold text-gray-900 mb-2">No Airlines Yet</h3>
          <p class="text-gray-600">Create your first airline to get started</p>
        </div>
      </div>
    </div>
  `
})
export class AdminAirlinesComponent implements OnInit {
  airlines: any[] = [];
  newAirline = { name: '', code: '', email: '' };
  loading = false;
  error = '';
  success = '';

  constructor(private airlineService: AirlineService) {}

  ngOnInit() {
    this.loadAirlines();
  }

  loadAirlines(): void {
    this.airlineService.getAirlines().subscribe({
      next: (response: any) => {
        this.airlines = response.airlines || response;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load airlines';
      }
    });
  }

  createAirline(): void {
    if (!this.newAirline.name || !this.newAirline.code || !this.newAirline.email) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.airlineService.createAirline(this.newAirline).subscribe({
      next: () => {
        this.success = 'Airline created successfully!';
        this.newAirline = { name: '', code: '', email: '' };
        this.loadAirlines();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to create airline';
        this.loading = false;
      }
    });
  }
}
