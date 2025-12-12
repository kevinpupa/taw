import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { SeatWebSocketService } from '../../services/seat-websocket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto">
      <h2 class="text-4xl font-bold mb-8 text-gray-800">Book Your Flight</h2>
      
      <div *ngIf="!selectedTrip" class="alert alert-warning">
        <p>No flight selected. <a routerLink="/search" class="font-semibold hover:underline">Go back to search</a></p>
      </div>
      
      <div *ngIf="selectedTrip" class="space-y-6">
        <!-- Flight Details Card -->
        <div class="card">
          <h3 class="text-2xl font-bold mb-4 text-gray-800">Selected Flight</h3>
          <div class="space-y-3">
            <div *ngFor="let flight of selectedTrip.flights" class="bg-sky-50 p-4 rounded-lg border border-sky-200">
              <p class="font-semibold text-lg text-gray-800">{{ flight.flightNumber }} - {{ flight.airline.name }}</p>
              <p class="text-gray-600">{{ formatDate(flight.departure.time) }} → {{ formatDate(flight.arrival.time) }}</p>
              <p class="text-gray-600">{{ flight.departure.airport.code }} → {{ flight.arrival.airport.code }}</p>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t">
            <p class="text-2xl font-bold text-sky-600">{{ selectedTrip.totalPrice | currency }}</p>
            <p *ngIf="availableSeatsCount" class="text-sm text-green-600 font-medium mt-2">
              {{ availableSeatsCount }} seats available
            </p>
          </div>
        </div>
        
        <!-- Booking Form -->
        <form (ngSubmit)="bookTicket()" class="card">
          <h3 class="text-2xl font-bold mb-6 text-gray-800">Passenger Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input 
                type="text" 
                [(ngModel)]="bookingForm.fullName" 
                name="fullName" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Email</label>
              <input 
                type="email" 
                [(ngModel)]="bookingForm.email" 
                name="email" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Phone (optional)</label>
              <input 
                type="text" 
                [(ngModel)]="bookingForm.phone" 
                name="phone"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
            </div>
            
            <div class="form-group">
              <label class="form-label">Ticket Class</label>
              <select 
                [(ngModel)]="bookingForm.ticketClass" 
                name="class"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>
          
          <!-- Seat Selection -->
          <div class="mb-6">
            <h3 class="text-lg font-bold mb-3 text-gray-800">Select Your Seat</h3>
            <div *ngIf="wsConnected" class="text-sm text-green-600 font-medium mb-3">
              Real-time seat availability enabled
            </div>
            <div class="seat-grid">
              <div *ngFor="let seat of availableSeats" 
                   [ngClass]="{
                     'seat': true, 
                     'seat-selected': bookingForm.seat === seat, 
                     'seat-booked': bookedSeats.includes(seat),
                     'seat-available': !bookedSeats.includes(seat) && bookingForm.seat !== seat
                   }"
                   (click)="!bookedSeats.includes(seat) && selectSeat(seat)"
                   [style.cursor]="bookedSeats.includes(seat) ? 'not-allowed' : 'pointer'">
                {{ seat }}
              </div>
            </div>
            <p class="text-gray-600 mt-2">Selected: <span class="font-semibold">{{ bookingForm.seat || 'None' }}</span></p>
          </div>
          
          <!-- Extras -->
          <div class="mb-6 bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-bold mb-4 text-gray-800">Add Extras</h3>
            <div class="space-y-3">
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  [(ngModel)]="bookingForm.extras.extraLegroom" 
                  name="legroom"
                  class="rounded">
                <span class="ml-3 text-gray-700">Extra Legroom - $25</span>
              </label>
              
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  [(ngModel)]="bookingForm.extras.extraBaggage" 
                  name="baggage"
                  class="rounded">
                <span class="ml-3 text-gray-700">Extra Baggage</span>
                <input 
                  type="number" 
                  [(ngModel)]="bookingForm.extras.extraBaggageCount" 
                  name="baggageCount" 
                  min="0" 
                  max="5" 
                  *ngIf="bookingForm.extras.extraBaggage"
                  class="ml-2 w-16 px-2 py-1 border border-gray-300 rounded"> pieces &#64; $15 each
              </label>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Special Meal</label>
                <select 
                  [(ngModel)]="bookingForm.extras.specialMeal" 
                  name="meal"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="standard">Standard</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="halal">Halal</option>
                  <option value="kosher">Kosher</option>
                  <option value="gluten-free">Gluten-Free</option>
                </select>
              </div>
            </div>
          </div>
          
          <div *ngIf="error" class="alert alert-error mb-6">{{ error }}</div>
          
          <button 
            [disabled]="loading"
            class="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
            {{ loading ? 'Processing...' : 'Complete Booking' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class BookingComponent implements OnInit, OnDestroy {
  selectedTrip: any = null;
  bookingForm = {
    fullName: '',
    email: '',
    phone: '',
    ticketClass: 'economy',
    seat: '',
    extras: {
      extraLegroom: false,
      extraBaggage: false,
      extraBaggageCount: 0,
      specialMeal: 'standard'
    }
  };

  availableSeats: string[] = [];
  bookedSeats: string[] = [];
  availableSeatsCount = 0;
  loading = false;
  error = '';
  wsConnected = false;

  private destroy$ = new Subject<void>();

  constructor(
    private ticketService: TicketService,
    public authService: AuthService,
    private router: Router,
    private seatWebSocketService: SeatWebSocketService
  ) {}

  ngOnInit() {
    const stored = sessionStorage.getItem('selectedTrip');
    if (stored) {
      this.selectedTrip = JSON.parse(stored);
      this.generateSeats();
      this.setupRealtimeSeats();
    }

    const user = this.authService.getCurrentUser();
    if (user) {
      this.bookingForm.email = user.email;
    }

    this.seatWebSocketService.getConnectionStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.wsConnected = connected;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.seatWebSocketService.disconnect();
  }

  private setupRealtimeSeats() {
    if (!this.selectedTrip || !this.selectedTrip.flights[0]) return;

    const flightId = this.selectedTrip.flights[0]._id || this.selectedTrip.flights[0].flightId;

    this.seatWebSocketService.joinFlight(flightId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (update: any) => {
          this.bookedSeats = update.bookedSeats || [];
          this.availableSeatsCount = update.availableSeats || 0;
        },
        error: (err) => {
          console.error('Error receiving seat updates:', err);
        }
      });
  }

  generateSeats(): void {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cols = Array.from({ length: 6 }, (_, i) => i + 1);
    this.availableSeats = rows.flatMap(row => cols.map(col => row + col));
    this.availableSeatsCount = this.availableSeats.length;
  }

  selectSeat(seat: string): void {
    if (this.bookedSeats.includes(seat)) {
      return;
    }
    this.bookingForm.seat = this.bookingForm.seat === seat ? '' : seat;
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString();
  }

  bookTicket(): void {
    if (!this.bookingForm.fullName || !this.bookingForm.email || !this.bookingForm.seat) {
      this.error = 'Please fill in all required fields';
      return;
    }

    if (!this.selectedTrip || !this.selectedTrip.flights || this.selectedTrip.flights.length === 0) {
      this.error = 'No valid flight selected';
      return;
    }

    this.loading = true;
    this.error = '';

    const flightId = this.selectedTrip.flights[0]._id || this.selectedTrip.flights[0].flightId;

    const bookingData = {
      flightId,
      ticketClass: this.bookingForm.ticketClass,
      seatNumber: this.bookingForm.seat,
      passengerDetails: {
        fullName: this.bookingForm.fullName,
        email: this.bookingForm.email,
        phone: this.bookingForm.phone
      },
      extras: this.bookingForm.extras
    };

    this.ticketService.purchaseTicket(bookingData).subscribe({
      next: (response: any) => {
        alert('Ticket booked successfully! Booking reference: ' + response.bookingReference);
        sessionStorage.removeItem('selectedTrip');
        this.router.navigate(['/my-tickets']);
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Booking failed';
        this.loading = false;
      }
    });
  }
}
