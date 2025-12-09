import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlightService } from '../../services/flight.service';

@Component({
  selector: 'app-airline-flights',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2>Manage Flights</h2>
      
      <form (ngSubmit)="createFlight()" class="card">
        <h3>Create New Flight</h3>
        
        <div class="grid-2">
          <div>
            <label>Flight Number:</label>
            <input type="text" [(ngModel)]="newFlight.flightNumber" name="flightNumber" required>
          </div>
          
          <div>
            <label>Route ID:</label>
            <input type="text" [(ngModel)]="newFlight.routeId" name="routeId" required>
          </div>
          
          <div>
            <label>Aircraft ID:</label>
            <input type="text" [(ngModel)]="newFlight.aircraftId" name="aircraftId" required>
          </div>
          
          <div>
            <label>Departure Time:</label>
            <input type="datetime-local" [(ngModel)]="newFlight.departureTime" name="depTime" required>
          </div>
          
          <div>
            <label>Economy Price:</label>
            <input type="number" [(ngModel)]="newFlight.economyPrice" name="economyPrice" required>
          </div>
          
          <div>
            <label>Business Price:</label>
            <input type="number" [(ngModel)]="newFlight.businessPrice" name="businessPrice" required>
          </div>
          
          <div>
            <label>First Class Price:</label>
            <input type="number" [(ngModel)]="newFlight.firstPrice" name="firstPrice" required>
          </div>
        </div>
        
        <button [disabled]="loading">{{ loading ? 'Creating...' : 'Create Flight' }}</button>
      </form>
      
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>
      
      <div *ngIf="flights.length > 0">
        <h3>Your Flights</h3>
        <table>
          <thead>
            <tr>
              <th>Flight Number</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Status</th>
              <th>Booked/Capacity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let flight of flights">
              <td>{{ flight.flightNumber }}</td>
              <td>{{ formatDate(flight.departureTime) }}</td>
              <td>{{ formatDate(flight.arrivalTime) }}</td>
              <td>{{ flight.status }}</td>
              <td>{{ flight.bookedSeats?.length }}/{{ flight.aircraft?.totalCapacity }}</td>
              <td>
                <button *ngIf="flight.status === 'scheduled'" (click)="cancelFlight(flight._id)" class="danger" [disabled]="cancelingId === flight._id">
                  {{ cancelingId === flight._id ? 'Canceling...' : 'Cancel' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
