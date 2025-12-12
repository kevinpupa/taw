import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../services/flight.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-airline-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold mb-8 text-gray-800">Flight Statistics</h2>
      
      <div *ngIf="loading" class="alert alert-info">Loading statistics...</div>
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      
      <div *ngIf="!loading && stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <p class="text-gray-600 text-sm font-semibold uppercase mb-2">Total Passengers</p>
          <p class="text-3xl font-bold text-sky-600">{{ stats.totalPassengers || 0 }}</p>
        </div>
        
        <div class="card">
          <p class="text-gray-600 text-sm font-semibold uppercase mb-2">Total Revenue</p>
          <p class="text-3xl font-bold text-green-600">{{ stats.totalRevenue | currency }}</p>
        </div>
        
        <div class="card">
          <p class="text-gray-600 text-sm font-semibold uppercase mb-2">Avg Occupancy</p>
          <p class="text-3xl font-bold text-blue-600">{{ stats.avgOccupancy | number:'1.1-1' }}%</p>
        </div>
        
        <div class="card">
          <p class="text-gray-600 text-sm font-semibold uppercase mb-2">Total Flights</p>
          <p class="text-3xl font-bold text-indigo-600">{{ stats.totalFlights || 0 }}</p>
        </div>
      </div>
      
      <div *ngIf="!loading && stats && stats.popularRoutes && stats.popularRoutes.length > 0" class="card">
        <h3 class="text-2xl font-bold mb-4 text-gray-800">Most Popular Routes</h3>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Passengers</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pr of stats.popularRoutes">
                <td class="font-medium">{{ (pr.route?.from || 'Unknown') }} → {{ (pr.route?.to || 'Unknown') }}</td>
                <td>{{ pr.passengerCount || 0 }}</td>
                <td class="text-green-600 font-semibold">{{ (pr.revenue || 0) | currency }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AirlineStatisticsComponent implements OnInit {
  stats: any = null;
  loading = true;
  error = '';

  constructor(
    private flightService: FlightService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Token is stored as httpOnly cookie and sent via withCredentials.
    // Attempt to load statistics; handle 401 in error handler.
    this.loadStatistics();
  }

  loadStatistics(): void {
    this.flightService.getFlightStats().subscribe({
      next: (response: any) => {
        this.stats = response;
        this.loading = false;
      },
      error: (err: any) => {
        const msg = err?.error?.error?.message;
        if (msg === 'Access denied. No token provided.' || msg === 'Invalid token.' || msg === 'Token expired.') {
          this.error = 'Authentication required. Please log in again.';
        } else if (msg === 'Airline admin access required.') {
          this.error = 'Airline admin access required.';
        } else {
          this.error = msg || 'Failed to load statistics';
        }
        this.loading = false;
      }
    });
  }
}

