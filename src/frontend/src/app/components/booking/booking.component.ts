import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketService } from '../../services/ticket.service';
import { FlightService } from '../../services/flight.service';
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
            <p class="text-2xl font-bold text-sky-600">{{ getTotalPrice() | currency }}</p>
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
                (ngModelChange)="onClassChange()"
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
              <div class="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span class="inline-block px-2 py-1 rounded bg-gray-200">Booked</span>
                <span class="inline-block px-2 py-1 rounded bg-sky-200">Available</span>
                <span class="inline-block px-2 py-1 rounded bg-green-200">Selected</span>
              </div>
              <div *ngFor="let row of seatMap" class="flex items-center gap-3 mb-2">
                <div class="w-28 text-sm font-medium text-gray-600">{{ row.class | titlecase }}</div>
                <div class="flex flex-wrap gap-2">
                  <div *ngFor="let s of row.seats"
                       class="seat"
                       [ngClass]="{
                         'seat-selected': bookingForm.seat === s.seatNumber,
                         'seat-booked': !s.isAvailable,
                         'opacity-50 cursor-not-allowed': !s.isAvailable || row.class !== bookingForm.ticketClass,
                         'seat-available': s.isAvailable && row.class === bookingForm.ticketClass && bookingForm.seat !== s.seatNumber
                       }"
                       [title]="!s.isAvailable ? 'Booked' : (row.class !== bookingForm.ticketClass ? 'Select ' + (bookingForm.ticketClass | titlecase) + ' seats' : (s.hasExtraLegroom ? 'Extra legroom' : ''))"
                       (click)="onSeatClick(s, row.class)">
                    {{ s.seatNumber }}
                  </div>
                </div>
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
                  [disabled]="!selectedSeatHasExtraLegroom"
                  class="rounded">
                <span class="ml-3 text-gray-700">Extra Legroom - {{ getExtraLegroomPrice() | currency }}</span>
              </label>
              
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  [(ngModel)]="bookingForm.extras.extraBaggage" 
                  name="baggage"
                  class="rounded">
                <span class="ml-3 text-gray-700">Extra Baggage - {{ extraBaggagePrice | currency }} each</span>
                <input 
                  type="number" 
                  [(ngModel)]="bookingForm.extras.extraBaggageCount" 
                  name="baggageCount" 
                  min="0" 
                  max="5" 
                  *ngIf="bookingForm.extras.extraBaggage"
                  class="ml-2 w-16 px-2 py-1 border border-gray-300 rounded"> pieces
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

          <!-- Price Summary -->
          <div class="mb-6 bg-sky-50 border border-sky-200 p-4 rounded-lg">
            <h3 class="text-lg font-bold mb-3 text-sky-800">Price Summary</h3>
            <div class="text-sm text-gray-700 space-y-1">
              <div class="flex justify-between">
                <span>Base fare ({{ bookingForm.ticketClass | titlecase }})</span>
                <span>{{ getBasePrice() | currency }}</span>
              </div>
              <div class="flex justify-between" *ngIf="bookingForm.extras.extraLegroom">
                <span>Extra legroom</span>
                <span>{{ getExtraLegroomPrice() | currency }}</span>
              </div>
              <div class="flex justify-between" *ngIf="bookingForm.extras.extraBaggage && bookingForm.extras.extraBaggageCount > 0">
                <span>Extra baggage ({{ bookingForm.extras.extraBaggageCount }} × {{ extraBaggagePrice | currency }})</span>
                <span>{{ (bookingForm.extras.extraBaggageCount * extraBaggagePrice) | currency }}</span>
              </div>
              <div class="flex justify-between font-semibold pt-2 border-t mt-2">
                <span>Total</span>
                <span>{{ getTotalPrice() | currency }}</span>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-2">Final total is confirmed at booking and may adjust based on seat features and airline pricing.</p>
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
  seatMap: any[] = [];
  selectedSeatClass: string | null = null;
  selectedSeatHasExtraLegroom = false;
  flightPricing: any[] = [];
  extraBaggagePrice = 15;
  extraLegroomPrices: { [key: string]: number } = {};
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
  flightDeparted = false;

  private destroy$ = new Subject<void>();

  constructor(
    private ticketService: TicketService,
    private flightService: FlightService,
    public authService: AuthService,
    private router: Router,
    private seatWebSocketService: SeatWebSocketService
  ) {}

  ngOnInit() {
    const stored = sessionStorage.getItem('selectedTrip');
    if (stored) {
      this.selectedTrip = JSON.parse(stored);
      const flightId = this.selectedTrip.flights[0]._id || this.selectedTrip.flights[0].flightId;
      this.checkDepartureStatus();
      this.loadSeatMap(flightId);
      this.loadFlightDetails(flightId);
      this.setupRealtimeSeats();
      },
      error: (err: any) => {
        // Show backend-provided error message if available
        const msg = err?.error?.message || err?.error?.error?.message;
        const firstDetail = Array.isArray(err?.error?.errors) ? err.error.errors[0]?.message : undefined;
        this.error = firstDetail || msg || 'Booking failed. Please try a different seat or flight.';
        this.loading = false;
      }

    const storedClass = sessionStorage.getItem('selectedClass');
    if (storedClass) {
      this.bookingForm.ticketClass = storedClass;
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
          // Update seatMap availability flags if we have it
          if (this.seatMap && this.seatMap.length) {
            this.seatMap = this.seatMap.map((row: any) => ({
              ...row,
              seats: row.seats.map((s: any) => ({
                ...s,
                isAvailable: !this.bookedSeats.includes((s.seatNumber || s))
              }))
            }));
          }
        },
        error: (err) => {
          console.error('Error receiving seat updates:', err);
        }
      });
  }

  private loadSeatMap(flightId: string) {
    this.ticketService.checkSeatAvailability(flightId).subscribe({
      next: (res) => {
        this.seatMap = res.seatMap || [];
        this.availableSeatsCount = res.availableSeats || 0;
        // Initialize bookedSeats list from response for consistency
        this.bookedSeats = Array.isArray(res.bookedSeats) ? res.bookedSeats : [];
      },
      error: (err) => {
        console.error('Failed to load seat map', err);
        // Fallback to simple grid if needed
        this.generateSeats();
      }
    });
  }

  private loadFlightDetails(flightId: string) {
    this.flightService.getFlightById(flightId).subscribe({
      next: (flight: any) => {
        this.flightPricing = flight.pricing || [];
        this.extraBaggagePrice = typeof flight.extraBaggagePrice === 'number' ? flight.extraBaggagePrice : this.extraBaggagePrice;
        // Build per-class extra legroom price map if present
        this.extraLegroomPrices = {};
        (this.flightPricing || []).forEach((p: any) => {
          if (p && typeof p.extraLegroomPrice === 'number') {
            this.extraLegroomPrices[p.class] = p.extraLegroomPrice;
          }
        });
      },
      error: (err) => console.error('Failed to load flight details', err)
    });
  }

  private checkDepartureStatus(): void {
    const flight = this.selectedTrip?.flights?.[0];
    const departure = flight?.departure?.time || flight?.departureTime;
    if (!departure) {
      this.flightDeparted = false;
      return;
    }
    this.flightDeparted = new Date(departure).getTime() < Date.now();
  }

  generateSeats(): void {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cols = Array.from({ length: 6 }, (_, i) => i + 1);
    this.availableSeats = rows.flatMap(row => cols.map(col => row + col));
    this.availableSeatsCount = this.availableSeats.length;
  }

  onSeatClick(seat: any, seatClass: string): void {
    if (!seat || !seat.isAvailable) return;
    if (seatClass !== this.bookingForm.ticketClass) {
      this.error = `Please select a ${this.bookingForm.ticketClass} seat`;
      return;
    }
    this.error = '';
    const next = this.bookingForm.seat === seat.seatNumber ? '' : seat.seatNumber;
    this.bookingForm.seat = next;
    this.selectedSeatClass = next ? seatClass : null;
    this.selectedSeatHasExtraLegroom = !!(next && seat.hasExtraLegroom);
    // Auto toggle legroom extra based on seat property
    this.bookingForm.extras.extraLegroom = this.selectedSeatHasExtraLegroom;
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString();
  }

  bookTicket(): void {
    if (this.flightDeparted) {
      this.error = 'This flight has already departed. Please search again for a new flight.';
      return;
    }
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
      ticketRequests: [{
        flightId,
        classType: this.bookingForm.ticketClass,
        seatNumber: this.bookingForm.seat,
        passengerDetails: {
          fullName: this.bookingForm.fullName,
          email: this.bookingForm.email,
          phone: this.bookingForm.phone
        },
        extras: this.bookingForm.extras
      }]
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

  // Pricing helpers (UI estimation)
  getBasePrice(): number {
    // Prefer flightPricing fetched from backend
    const cls = this.bookingForm.ticketClass;
    if (this.flightPricing && this.flightPricing.length) {
      const p = this.flightPricing.find((x: any) => x.class === cls);
      if (p && typeof p.basePrice === 'number') return p.basePrice;
    }
    if (!this.selectedTrip || !this.selectedTrip.flights) return 0;
    // Try to compute from flights' pricing arrays
    let sum = 0;
    for (const f of this.selectedTrip.flights) {
      const p = (f.pricing || []).find((x: any) => x.class === cls);
      if (p && typeof p.basePrice === 'number') sum += p.basePrice;
    }
    // Fallback to pricePerPerson from search if class matches search selection
    if (sum === 0 && typeof this.selectedTrip.pricePerPerson === 'number') {
      sum = this.selectedTrip.pricePerPerson;
    }
    return sum;
  }

  getExtrasPrice(): number {
    let extra = 0;
    if (this.bookingForm.extras.extraLegroom) extra += this.getExtraLegroomPrice();
    if (this.bookingForm.extras.extraBaggage && this.bookingForm.extras.extraBaggageCount > 0) {
      extra += this.bookingForm.extras.extraBaggageCount * this.extraBaggagePrice;
    }
    return extra;
  }

  getTotalPrice(): number {
    return this.getBasePrice() + this.getExtrasPrice();
  }

  getExtraLegroomPrice(): number {
    const cls = this.bookingForm.ticketClass;
    const v = this.extraLegroomPrices[cls];
    return typeof v === 'number' ? v : 25; // fallback
  }

  onClassChange() {
    // Clear seat if it doesn't match the selected class
    if (this.selectedSeatClass && this.selectedSeatClass !== this.bookingForm.ticketClass) {
      this.bookingForm.seat = '';
      this.selectedSeatClass = null;
      this.selectedSeatHasExtraLegroom = false;
      this.bookingForm.extras.extraLegroom = false;
    }
    this.error = '';
  }
}
