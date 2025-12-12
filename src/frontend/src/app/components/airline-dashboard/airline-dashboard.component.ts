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
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-10">
        <h1 class="text-4xl font-bold text-sky-900 mb-2">Airline Dashboard</h1>
        <p class="text-gray-600">Manage your airline operations and view performance metrics</p>
      </div>

      <!-- Key Metrics -->
      <div *ngIf="!loading && stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div class="bg-gradient-to-br from-sky-50 to-blue-50 border-l-4 border-sky-500 p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 class="text-gray-600 text-xs font-semibold uppercase tracking-wider">Total Passengers</h3>
          <p class="text-4xl font-bold text-sky-600 mt-3">{{ stats.totalPassengers || 0 }}</p>
          <p class="text-xs text-gray-500 mt-2">Across all flights</p>
        </div>
        
        <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500 p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 class="text-gray-600 text-xs font-semibold uppercase tracking-wider">Total Revenue</h3>
          <p class="text-4xl font-bold text-green-600 mt-3">{{ stats.totalRevenue | currency }}</p>
          <p class="text-xs text-gray-500 mt-2">All time earnings</p>
        </div>
        
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-purple-500 p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 class="text-gray-600 text-xs font-semibold uppercase tracking-wider">Avg Occupancy</h3>
          <p class="text-4xl font-bold text-purple-600 mt-3">{{ stats.avgOccupancy | number:'1.1-1' }}%</p>
          <p class="text-xs text-gray-500 mt-2">Overall load factor</p>
        </div>
        
        <div class="bg-gradient-to-br from-orange-50 to-amber-50 border-l-4 border-orange-500 p-6 rounded-lg shadow-md hover:shadow-lg transition">
          <h3 class="text-gray-600 text-xs font-semibold uppercase tracking-wider">Active Flights</h3>
          <p class="text-4xl font-bold text-orange-600 mt-3">{{ stats.totalFlights || 0 }}</p>
          <p class="text-xs text-gray-500 mt-2">Scheduled operations</p>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-12">
        <p class="text-gray-600 text-lg">Loading dashboard...</p>
      </div>

      <div *ngIf="error" class="bg-red-50 border border-red-300 text-red-800 px-6 py-4 rounded-lg mb-8 font-medium">
        {{ error }}
      </div>

      <!-- Management Sections -->
      <div class="mb-10">
        <h2 class="text-2xl font-bold text-sky-900 mb-6">Management Tools</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-xl shadow-md border-t-4 border-sky-500 hover:shadow-xl transition transform hover:-translate-y-1">
            <div class="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
              <span class="text-xl">🛣️</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Routes</h3>
            <p class="text-gray-600 text-sm mb-4">Create and manage flight routes between airports</p>
            <a routerLink="/airline/routes" class="inline-block bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium transition">
              Manage
            </a>
          </div>
          
          <div class="bg-white p-6 rounded-xl shadow-md border-t-4 border-blue-500 hover:shadow-xl transition transform hover:-translate-y-1">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span class="text-xl">✈️</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Aircraft</h3>
            <p class="text-gray-600 text-sm mb-4">Add and manage your airline fleet</p>
            <a routerLink="/airline/aircraft" class="inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition">
              Manage
            </a>
          </div>
          
          <div class="bg-white p-6 rounded-xl shadow-md border-t-4 border-cyan-500 hover:shadow-xl transition transform hover:-translate-y-1">
            <div class="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
              <span class="text-xl">🎫</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Flights</h3>
            <p class="text-gray-600 text-sm mb-4">Create and schedule your flights</p>
            <a routerLink="/airline/flights" class="inline-block bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition">
              Manage
            </a>
          </div>
          
          <div class="bg-white p-6 rounded-xl shadow-md border-t-4 border-indigo-500 hover:shadow-xl transition transform hover:-translate-y-1">
            <div class="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span class="text-xl">📊</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Statistics</h3>
            <p class="text-gray-600 text-sm mb-4">Detailed analytics and performance data</p>
            <a routerLink="/airline/statistics" class="inline-block bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition">
              View
            </a>
          </div>
        </div>
      </div>

      <!-- Popular Routes -->
      <div *ngIf="!loading && stats && stats.popularRoutes && stats.popularRoutes.length > 0" class="card">
        <h2 class="text-2xl font-bold text-sky-900 mb-6">Most Popular Routes</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-sky-100 border-b border-sky-300">
                <th class="px-6 py-4 text-left text-sm font-semibold text-sky-900">Route</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-sky-900">Passengers</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-sky-900">Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let route of stats.popularRoutes" class="border-b border-gray-200 hover:bg-sky-50 transition">
                <td class="px-6 py-4 font-semibold text-gray-700">{{ route._id.from }} <span class="text-gray-500">→</span> {{ route._id.to }}</td>
                <td class="px-6 py-4 text-gray-700">{{ route.passengers }}</td>
                <td class="px-6 py-4 font-bold text-green-600">{{ route.revenue | currency }}</td>
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

