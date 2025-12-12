import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../../services/flight.service';

@Component({
  selector: 'app-airline-flights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold mb-8 text-sky-900">Manage Flights</h2>
      
      <form (ngSubmit)="createFlight()" class="card mb-8">
        <h3 class="text-2xl font-semibold text-sky-800 mb-6">Create New Flight</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Flight Number:</label>
            <input 
              type="text" 
              [(ngModel)]="newFlight.flightNumber" 
              name="flightNumber" 
              placeholder="e.g., AA123"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Route ID:</label>
            <input 
              type="text" 
              [(ngModel)]="newFlight.routeId" 
              name="routeId" 
              placeholder="Route identifier"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Aircraft ID:</label>
            <input 
              type="text" 
              [(ngModel)]="newFlight.aircraftId" 
              name="aircraftId" 
              placeholder="Aircraft identifier"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Departure Time:</label>
            <input 
              type="datetime-local" 
              [(ngModel)]="newFlight.departureTime" 
              name="depTime"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Economy Price:</label>
            <input 
              type="number" 
              [(ngModel)]="newFlight.economyPrice" 
              name="economyPrice"
              placeholder="0.00"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Business Price:</label>
            <input 
              type="number" 
              [(ngModel)]="newFlight.businessPrice" 
              name="businessPrice"
              placeholder="0.00"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">First Class Price:</label>
            <input 
              type="number" 
              [(ngModel)]="newFlight.firstPrice" 
              name="firstPrice"
              placeholder="0.00"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
        </div>
        
        <button 
          [disabled]="loading"
          class="btn btn-primary w-full md:w-auto">
          {{ loading ? 'Creating...' : 'Create Flight' }}
        </button>
      </form>
      
      <div *ngIf="error" class="alert alert-error mb-6">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success mb-6">{{ success }}</div>
      
      <div *ngIf="flights.length > 0" class="card">
        <h3 class="text-2xl font-semibold text-sky-800 mb-6">Your Flights</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-sky-100 border-b border-sky-300">
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Flight Number</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Departure</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Arrival</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Status</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Capacity</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                *ngFor="let flight of flights" 
                class="border-b border-gray-200 hover:bg-sky-50 transition">
                <td class="px-6 py-4 font-semibold text-gray-700">{{ flight.flightNumber }}</td>
                <td class="px-6 py-4 text-gray-700">{{ formatDate(flight.departureTime) }}</td>
                <td class="px-6 py-4 text-gray-700">{{ formatDate(flight.arrivalTime) }}</td>
                <td class="px-6 py-4">
                  <span [class]="flight.status === 'scheduled' ? 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium' : 
                                 flight.status === 'cancelled' ? 'bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium' :
                                 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium'">
                    {{ flight.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-gray-700">{{ flight.bookedSeats?.length }}/{{ flight.aircraft?.totalCapacity }}</td>
                <td class="px-6 py-4">
                  <button 
                    *ngIf="flight.status === 'scheduled'" 
                    (click)="cancelFlight(flight._id)" 
                    class="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition" 
                    [disabled]="cancelingId === flight._id">
                    {{ cancelingId === flight._id ? 'Canceling...' : 'Cancel' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="flights.length === 0 && !loading" class="card text-center py-12">
        <p class="text-gray-500 text-lg">No flights created yet. Create your first flight above!</p>
      </div>
    </div>
  `
})
export class AirlineFlightsComponent implements OnInit {
  flights: any[] = [];
  newFlight = {
    flightNumber: '',
    routeId: '',
    aircraftId: '',
    departureTime: '',
    economyPrice: 0,
    businessPrice: 0,
    firstPrice: 0
  };
  loading = false;
  error = '';
  success = '';
  cancelingId = '';

  constructor(private flightService: FlightService) {}

  ngOnInit() {
    this.loadFlights();
  }

  loadFlights(): void {
    this.flightService.getFlights().subscribe({
      next: (response: any) => {
        this.flights = response.flights || response;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load flights';
      }
    });
  }

  createFlight(): void {
    if (!this.newFlight.flightNumber || !this.newFlight.routeId || !this.newFlight.aircraftId) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const flightData = {
      flightNumber: this.newFlight.flightNumber,
      route: this.newFlight.routeId,
      aircraft: this.newFlight.aircraftId,
      departureTime: new Date(this.newFlight.departureTime),
      pricing: [
        { class: 'economy', basePrice: this.newFlight.economyPrice },
        { class: 'business', basePrice: this.newFlight.businessPrice },
        { class: 'first', basePrice: this.newFlight.firstPrice }
      ]
    };

    this.flightService.createFlight(flightData).subscribe({
      next: () => {
        this.success = 'Flight created successfully!';
        this.newFlight = {
          flightNumber: '',
          routeId: '',
          aircraftId: '',
          departureTime: '',
          economyPrice: 0,
          businessPrice: 0,
          firstPrice: 0
        };
        this.loadFlights();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to create flight';
        this.loading = false;
      }
    });
  }

  cancelFlight(flightId: string): void {
    if (!confirm('Are you sure you want to cancel this flight?')) return;

    this.cancelingId = flightId;

    this.flightService.cancelFlight(flightId).subscribe({
      next: () => {
        alert('Flight cancelled successfully');
        this.loadFlights();
        this.cancelingId = '';
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to cancel flight';
        this.cancelingId = '';
      }
    });
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString();
  }
}
