import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AirlineService } from '../../services/airline.service';

@Component({
  selector: 'app-airline-routes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold mb-8 text-sky-900">Manage Routes</h2>
      
      <!-- Create Route Form -->
      <form (ngSubmit)="createRoute()" class="card mb-8">
        <h3 class="text-2xl font-semibold text-sky-800 mb-6">Create New Route</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Departure Airport Code:</label>
            <input 
              type="text" 
              [(ngModel)]="newRoute.departureAirportCode" 
              name="depCode" 
              required
              placeholder="e.g., JFK"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Departure City:</label>
            <input 
              type="text" 
              [(ngModel)]="newRoute.departureCity" 
              name="depCity" 
              required
              placeholder="e.g., New York"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Arrival Airport Code:</label>
            <input 
              type="text" 
              [(ngModel)]="newRoute.arrivalAirportCode" 
              name="arrCode" 
              required
              placeholder="e.g., LAX"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Arrival City:</label>
            <input 
              type="text" 
              [(ngModel)]="newRoute.arrivalCity" 
              name="arrCity" 
              required
              placeholder="e.g., Los Angeles"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Duration (minutes):</label>
            <input 
              type="number" 
              [(ngModel)]="newRoute.duration" 
              name="duration" 
              required
              placeholder="e.g., 300"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>
          
          <div></div>
        </div>
        
        <button 
          [disabled]="loading"
          class="btn btn-primary w-full md:w-auto">
          {{ loading ? 'Creating...' : 'Create Route' }}
        </button>
      </form>
      
      <div *ngIf="error" class="alert alert-error mb-6">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success mb-6">{{ success }}</div>
      
      <!-- Routes List -->
      <div *ngIf="routes.length > 0" class="card">
        <h3 class="text-2xl font-semibold text-sky-800 mb-6">Your Routes</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-sky-100 border-b border-sky-300">
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">From</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">To</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Duration</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                *ngFor="let route of routes" 
                class="border-b border-gray-200 hover:bg-sky-50 transition">
                <td class="px-6 py-4 text-gray-700">{{ route.departureAirport?.code }} - {{ route.departureAirport?.city }}</td>
                <td class="px-6 py-4 text-gray-700">{{ route.arrivalAirport?.code }} - {{ route.arrivalAirport?.city }}</td>
                <td class="px-6 py-4 text-gray-700">{{ route.duration }} min</td>
                <td class="px-6 py-4">
                  <span [class]="route.isActive ? 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium' : 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium'">
                    {{ route.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="routes.length === 0 && !loading" class="card text-center py-12">
        <p class="text-gray-500 text-lg">No routes created yet. Create your first route above!</p>
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
