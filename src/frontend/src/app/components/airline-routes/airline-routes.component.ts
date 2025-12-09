import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AirlineService } from '../../services/airline.service';

@Component({
  selector: 'app-airline-routes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2>Manage Routes</h2>
      
      <!-- Create Route Form -->
      <form (ngSubmit)="createRoute()" class="card">
        <h3>Create New Route</h3>
        
        <div class="grid-2">
          <div>
            <label>Departure Airport Code:</label>
            <input type="text" [(ngModel)]="newRoute.departureAirportCode" name="depCode" required>
          </div>
          
          <div>
            <label>Departure City:</label>
            <input type="text" [(ngModel)]="newRoute.departureCity" name="depCity" required>
          </div>
          
          <div>
            <label>Arrival Airport Code:</label>
            <input type="text" [(ngModel)]="newRoute.arrivalAirportCode" name="arrCode" required>
          </div>
          
          <div>
            <label>Arrival City:</label>
            <input type="text" [(ngModel)]="newRoute.arrivalCity" name="arrCity" required>
          </div>
          
          <div>
            <label>Duration (minutes):</label>
            <input type="number" [(ngModel)]="newRoute.duration" name="duration" required>
          </div>
          
          <div></div>
        </div>
        
        <button [disabled]="loading">{{ loading ? 'Creating...' : 'Create Route' }}</button>
      </form>
      
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>
      
      <!-- Routes List -->
      <div *ngIf="routes.length > 0">
        <h3>Your Routes</h3>
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let route of routes">
              <td>{{ route.departureAirport?.code }} - {{ route.departureAirport?.city }}</td>
              <td>{{ route.arrivalAirport?.code }} - {{ route.arrivalAirport?.city }}</td>
              <td>{{ route.duration }} min</td>
              <td>{{ route.isActive ? 'Active' : 'Inactive' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AirlineRoutesComponent implements OnInit {
  routes: any[] = [];
  newRoute = {
    departureAirportCode: '',
    departureCity: '',
    arrivalAirportCode: '',
    arrivalCity: '',
    duration: 0
  };
  loading = false;
  error = '';
  success = '';

  constructor(private airlineService: AirlineService) {}

  ngOnInit() {
    this.loadRoutes();
  }

  loadRoutes(): void {
    this.airlineService.getRoutes().subscribe({
      next: (response: any) => {
        this.routes = response.routes || response;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load routes';
      }
    });
  }

  createRoute(): void {
    if (!this.newRoute.departureAirportCode || !this.newRoute.arrivalAirportCode) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const routeData = {
      departureAirport: {
        code: this.newRoute.departureAirportCode.toUpperCase(),
        city: this.newRoute.departureCity
      },
      arrivalAirport: {
        code: this.newRoute.arrivalAirportCode.toUpperCase(),
        city: this.newRoute.arrivalCity
      },
      duration: this.newRoute.duration
    };

    this.airlineService.createRoute(routeData).subscribe({
      next: () => {
        this.success = 'Route created successfully!';
        this.newRoute = {
          departureAirportCode: '',
          departureCity: '',
          arrivalAirportCode: '',
          arrivalCity: '',
          duration: 0
        };
        this.loadRoutes();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to create route';
        this.loading = false;
      }
    });
  }
}
