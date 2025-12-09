import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { SeatWebSocketService } from '../../services/seat-websocket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2>Book Flight</h2>
      
      <div *ngIf="!selectedTrip" class="alert alert-warning">
        <p>No flight selected. <a routerLink="/search">Go back to search</a></p>
      </div>
      
      <div *ngIf="selectedTrip">
        <!-- Display selected flight details -->
        <div class="card">
          <h3>Selected Flight</h3>
          <div *ngFor="let flight of selectedTrip.flights">
            <p><strong>{{ flight.flightNumber }}</strong> - {{ flight.airline.name }}</p>
            <p>{{ formatDate(flight.departure.time) }} → {{ formatDate(flight.arrival.time) }}</p>
            <p>{{ flight.departure.airport.code }} → {{ flight.arrival.airport.code }}</p>
          </div>
          <p><strong>Total Price: \${{ selectedTrip.totalPrice }}</strong></p>
          <p *ngIf="availableSeatsCount" style="color: green; font-size: 12px;">
            Available seats: {{ availableSeatsCount }}
          </p>
        </div>
        
        <!-- Booking form -->
        <form (ngSubmit)="bookTicket()" class="card">
          <h3>Passenger Details</h3>
          
          <div class="grid-2">
            <div>
              <label>Full Name:</label>
              <input type="text" [(ngModel)]="bookingForm.fullName" name="fullName" required>
            </div>
            
            <div>
              <label>Email:</label>
              <input type="email" [(ngModel)]="bookingForm.email" name="email" required>
            </div>
            
            <div>
              <label>Phone (optional):</label>
              <input type="text" [(ngModel)]="bookingForm.phone" name="phone">
            </div>
            
            <div>
              <label>Ticket Class:</label>
              <select [(ngModel)]="bookingForm.ticketClass" name="class">
                <option>economy</option>
                <option>business</option>
                <option>first</option>
              </select>
            </div>
          </div>
          
          <!-- Seat Selection with Real-Time Availability -->
          <h3>Select Your Seat</h3>
          <div *ngIf="wsConnected" style="color: green; font-size: 12px; margin-bottom: 10px;">
            ✓ Real-time seat availability enabled
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
          <p>Selected: {{ bookingForm.seat || 'None' }}</p>
          
          <!-- Extras -->
          <h3>Extras</h3>
          <div class="extras-section">
            <div class="extra-item">
              <input type="checkbox" [(ngModel)]="bookingForm.extras.extraLegroom" name="legroom" id="legroom">
              <label for="legroom">Extra Legroom - \$25</label>
            </div>
            
            <div class="extra-item">
              <input type="checkbox" [(ngModel)]="bookingForm.extras.extraBaggage" name="baggage" id="baggage">
              <label for="baggage">Extra Baggage</label>
              <input type="number" [(ngModel)]="bookingForm.extras.extraBaggageCount" name="baggageCount" min="0" max="5" *ngIf="bookingForm.extras.extraBaggage"> pieces &#64; \$15 each
            </div>
            
            <div>
              <label>Special Meal:</label>
              <select [(ngModel)]="bookingForm.extras.specialMeal" name="meal">
                <option>standard</option>
                <option>vegetarian</option>
                <option>vegan</option>
                <option>halal</option>
                <option>kosher</option>
                <option>gluten-free</option>
              </select>
            </div>
          </div>
          
          <div *ngIf="error" class="alert alert-error">{{ error }}</div>
          <button [disabled]="loading">{{ loading ? 'Booking...' : 'Complete Booking' }}</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .seat-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin: 15px 0;
    }
    .seat {
      padding: 10px;
      text-align: center;
      border: 2px solid #ddd;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .seat-available {
      background: #e8f5e9;
      border-color: #4caf50;
      color: #2e7d32;
    }
    .seat-available:hover {
      background: #c8e6c9;
    }
    .seat-selected {
      background: #4caf50;
      color: white;
      border-color: #2e7d32;
    }
    .seat-booked {
      background: #ffebee;
      border-color: #f44336;
      color: #c62828;
      cursor: not-allowed;
      opacity: 0.7;
    }
    .extras-section {
      margin: 15px 0;
    }
    .extra-item {
      margin: 10px 0;
    }
  `]
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

    // Pre-fill email from current user
    const user = this.authService.getCurrentUser();
    if (user) {
      this.bookingForm.email = user.email;
    }

    // Monitor WebSocket connection
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
