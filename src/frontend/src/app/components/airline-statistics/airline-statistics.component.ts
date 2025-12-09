import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlightService } from '../../services/flight.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-airline-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2>Flight Statistics</h2>
      
      <div *ngIf="loading" class="alert alert-info">Loading statistics...</div>
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      
      <div *ngIf="!loading && stats" class="grid">
        <div class="card">
          <h3>Total Passengers</h3>
          <p style="font-size: 24px; font-weight: bold;">{{ stats.totalPassengers || 0 }}</p>
        </div>
        
        <div class="card">
          <h3>Total Revenue</h3>
          <p style="font-size: 24px; font-weight: bold;">\${{ stats.totalRevenue | number:'1.2-2' }}</p>
        </div>
        
        <div class="card">
          <h3>Average Occupancy</h3>
          <p style="font-size: 24px; font-weight: bold;">{{ stats.avgOccupancy | number:'1.1-1' }}%</p>
        </div>
        
        <div class="card">
          <h3>Total Flights</h3>
          <p style="font-size: 24px; font-weight: bold;">{{ stats.totalFlights || 0 }}</p>
        </div>
      </div>
      
      <div *ngIf="!loading && stats && stats.popularRoutes && stats.popularRoutes.length > 0" class="card">
        <h3>Most Popular Routes</h3>
        <table>
          <thead>
            <tr>
              <th>Route</th>
              <th>Passengers</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let route of stats.popularRoutes">
              <td>{{ route._id.from }} → {{ route._id.to }}</td>
              <td>{{ route.passengers }}</td>
              <td>\${{ route.revenue | number:'1.2-2' }}</td>
            </tr>
          </tbody>
        </table>
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
    // Ensure token is available before making API calls
    const token = this.authService.getToken();
    if (token) {
      this.loadStatistics();
    } else {
      this.error = 'Authentication token not found. Please log in again.';
      this.loading = false;
    }
  }

  loadStatistics(): void {
    this.flightService.getFlightStats().subscribe({
      next: (response: any) => {
        this.stats = response;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load statistics';
        this.loading = false;
      }
    });
  }
}

