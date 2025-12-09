import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-airline-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-8">Airline Dashboard</h1>
      
      <!-- Key Metrics -->
      <div *ngIf="!loading && stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg shadow">
          <h3 class="text-gray-600 text-sm font-semibold uppercase">Total Passengers</h3>
          <p class="text-3xl font-bold text-blue-600 mt-2">{{ stats.totalPassengers || 0 }}</p>
        </div>
        
        <div class="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow">
          <h3 class="text-gray-600 text-sm font-semibold uppercase">Total Revenue</h3>
          <p class="text-3xl font-bold text-green-600 mt-2">\${{ stats.totalRevenue | number:'1.2-2' }}</p>
        </div>
        
        <div class="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg shadow">
          <h3 class="text-gray-600 text-sm font-semibold uppercase">Avg Occupancy</h3>
          <p class="text-3xl font-bold text-purple-600 mt-2">{{ stats.avgOccupancy | number:'1.1-1' }}%</p>
        </div>
        
        <div class="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-lg shadow">
          <h3 class="text-gray-600 text-sm font-semibold uppercase">Active Flights</h3>
          <p class="text-3xl font-bold text-orange-600 mt-2">{{ stats.totalFlights || 0 }}</p>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-8">
        <p class="text-gray-600">Loading dashboard...</p>
      </div>

      <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        {{ error }}
      </div>

      <!-- Management Sections -->
      <h2 class="text-2xl font-bold mb-6">Management</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-blue-500 hover:shadow-lg transition">
          <h3 class="text-lg font-bold text-gray-800 mb-2">📍 Manage Routes</h3>
          <p class="text-gray-600 text-sm mb-4">Create and manage flight routes between airports</p>
          <a routerLink="/airline/routes" class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
            Go to Routes
          </a>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500 hover:shadow-lg transition">
          <h3 class="text-lg font-bold text-gray-800 mb-2">✈️ Manage Aircraft</h3>
          <p class="text-gray-600 text-sm mb-4">Add and manage your airline fleet</p>
          <a routerLink="/airline/aircraft" class="inline-block bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition">
            Go to Aircraft
          </a>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500 hover:shadow-lg transition">
          <h3 class="text-lg font-bold text-gray-800 mb-2">🛫 Manage Flights</h3>
          <p class="text-gray-600 text-sm mb-4">Create and schedule your flights</p>
          <a routerLink="/airline/flights" class="inline-block bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded transition">
            Go to Flights
          </a>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow-md border-t-4 border-orange-500 hover:shadow-lg transition">
          <h3 class="text-lg font-bold text-gray-800 mb-2">📊 View Statistics</h3>
          <p class="text-gray-600 text-sm mb-4">Detailed analytics and performance data</p>
          <a routerLink="/airline/statistics" class="inline-block bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition">
            Go to Statistics
          </a>
        </div>
      </div>

      <!-- Popular Routes -->
      <div *ngIf="!loading && stats && stats.popularRoutes && stats.popularRoutes.length > 0" class="mt-10">
        <h2 class="text-2xl font-bold mb-6">Most Popular Routes</h2>
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-100 border-b">
              <tr>
                <th class="px-6 py-3 text-left font-semibold text-gray-700">Route</th>
                <th class="px-6 py-3 text-left font-semibold text-gray-700">Passengers</th>
                <th class="px-6 py-3 text-left font-semibold text-gray-700">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let route of stats.popularRoutes" class="border-b hover:bg-gray-50">
                <td class="px-6 py-3 font-medium text-gray-800">{{ route._id.from }} → {{ route._id.to }}</td>
                <td class="px-6 py-3 text-gray-600">{{ route.passengers }}</td>
                <td class="px-6 py-3 text-green-600 font-semibold">\${{ route.revenue | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AirlineDashboardComponent implements OnInit {
  stats: any = null;
  loading = true;
  error = '';

  constructor(
    private flightService: FlightService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Ensure token is available before making API calls
    const token = this.authService.getToken();
    if (token) {
      this.loadDashboardData();
    } else {
      this.error = 'Authentication token not found. Please log in again.';
      this.loading = false;
    }
  }

  loadDashboardData(): void {
    this.flightService.getFlightStats().subscribe({
      next: (response: any) => {
        this.stats = response;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }
}

