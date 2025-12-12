import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto">
      <h2 class="text-4xl font-bold mb-8 text-gray-800">Find Flights</h2>
      
      <form (ngSubmit)="search()" class="bg-white p-8 rounded-lg shadow-md mb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div class="relative">
            <label class="form-label">From</label>
            <input 
              type="text" 
              [(ngModel)]="searchForm.from" 
              (input)="filterAirports('from')"
              (focus)="onFromFocus()"
              (blur)="closeFromDropdown()"
              name="from" 
              placeholder="Departure city"
              autocomplete="off"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
            <div *ngIf="showFromDropdown && filteredFromAirports.length > 0" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
              <div *ngFor="let airport of filteredFromAirports" 
                (mousedown)="$event.preventDefault()"
                (click)="selectAirport('from', airport)"
                class="px-4 py-2 hover:bg-sky-100 cursor-pointer text-sm">
                {{ airport.code }} - {{ airport.city }}, {{ airport.country }}
              </div>
            </div>
          </div>
          
          <div class="relative">
            <label class="form-label">To</label>
            <input 
              type="text" 
              [(ngModel)]="searchForm.to" 
              (input)="filterAirports('to')"
              (focus)="onToFocus()"
              (blur)="closeToDropdown()"
              name="to" 
              placeholder="Arrival city"
              autocomplete="off"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
            <div *ngIf="showToDropdown && filteredToAirports.length > 0" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
              <div *ngFor="let airport of filteredToAirports" 
                (mousedown)="$event.preventDefault()"
                (click)="selectAirport('to', airport)"
                class="px-4 py-2 hover:bg-sky-100 cursor-pointer text-sm">
                {{ airport.code }} - {{ airport.city }}, {{ airport.country }}
              </div>
            </div>
          </div>
          
          <div>
            <label class="form-label">Date</label>
            <input type="date" [(ngModel)]="searchForm.date" name="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" required>
          </div>
          
          <div>
            <label class="form-label">Passengers</label>
            <input type="number" [(ngModel)]="searchForm.passengers" name="passengers" min="1" max="9" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>
          
          <div>
            <label class="form-label">Class</label>
            <select [(ngModel)]="searchForm.class" name="class" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
          
          <div>
            <label class="form-label">Sort by</label>
            <select [(ngModel)]="searchForm.sort" name="sort" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="price">Price</option>
              <option value="duration">Duration</option>
              <option value="departure">Departure Time</option>
              <option value="stops">Stops</option>
            </select>
          </div>
        </div>
        
        <button 
          [disabled]="loading" 
          class="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
          {{ loading ? 'Searching...' : 'Search Flights' }}
        </button>
      </form>
      
      <div *ngIf="error" class="alert alert-error mb-6">{{ error }}</div>
      
      <!-- Alternative dates suggestion -->
      <div *ngIf="searched && !loading && results.length === 0 && alternativeDates.length > 0" class="bg-sky-50 border border-sky-200 p-6 rounded-lg mb-6">
        <p class="text-sky-800 font-semibold mb-3">No flights found. Try these dates:</p>
        <div class="flex flex-wrap gap-2">
          <button *ngFor="let altDate of alternativeDates" 
            (click)="selectAlternativeDate(altDate.date)"
            class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition text-sm">
            {{ altDate.date }} ({{ altDate.flights }} flights)
          </button>
        </div>
      </div>
      
      <!-- Results -->
      <div *ngIf="results && results.length > 0" class="space-y-4">
        <h3 class="text-2xl font-bold text-gray-800">Found {{ results.length }} flights</h3>
        
        <div *ngFor="let trip of results" class="bg-white p-6 rounded-lg shadow-md border-l-4 border-sky-500 hover:shadow-lg transition">
          <div class="flex justify-between items-start mb-4">
            <div>
              <span class="inline-block bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-medium">
                {{ trip.stops === 0 ? 'Direct' : trip.stops + ' Stop(s)' }}
              </span>
            </div>
            <div class="text-right">
              <p class="text-2xl font-bold text-sky-600">{{ trip.totalPrice | currency }}</p>
              <p class="text-sm text-gray-500">{{ trip.pricePerPerson | currency }}/person</p>
            </div>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm border-b pb-4">
            <div>
              <p class="text-gray-600">Duration</p>
              <p class="font-semibold">{{ trip.totalDuration }} min</p>
            </div>
          </div>
          
          <div class="space-y-3 mb-4">
            <div *ngFor="let flight of trip.flights; let i = index" class="text-sm bg-gray-50 p-3 rounded">
              <p class="font-semibold text-gray-800">{{ flight.flightNumber }} - {{ flight.airline.name }}</p>
              <p class="text-gray-600">{{ formatDate(flight.departure.time) }} {{ flight.departure.airport.code }} → {{ formatDate(flight.arrival.time) }} {{ flight.arrival.airport.code }}</p>
              <p class="text-gray-500">{{ flight.aircraft }} | {{ flight.availableSeats }} seats</p>
            </div>
          </div>
          
          <button 
            (click)="bookFlight(trip)" 
            class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition">
            {{ authService.isAuthenticated() ? 'Book Now' : 'Login to Book' }}
          </button>
        </div>
      </div>
      
      <div *ngIf="searched && !loading && results.length === 0" class="bg-gray-50 p-8 rounded-lg text-center">
        <p class="text-gray-600 text-lg">No flights found. Try different search criteria.</p>
      </div>
    </div>
  `
})
export class SearchComponent implements OnInit {
  searchForm = {
    from: '',
    to: '',
    date: new Date().toISOString().split('T')[0],
    passengers: 1,
    class: 'economy',
    sort: 'price',
    order: 'asc',
    maxStops: 1
  };

  results: any[] = [];
  loading = false;
  error = '';
  searched = false;
  alternativeDates: any[] = [];

  allAirports: any[] = [];
  filteredFromAirports: any[] = [];
  filteredToAirports: any[] = [];
  showFromDropdown = false;
  showToDropdown = false;

  constructor(
    private flightService: FlightService,
    public authService: AuthService,
    private router: Router
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: any) {
    if (event.target.closest('.airport-input') === null) {
      this.showFromDropdown = false;
      this.showToDropdown = false;
    }
  }

  ngOnInit() {
    this.loadAirports();
  }

  loadAirports() {
    this.flightService.getAvailableAirports().subscribe({
      next: (airports: any) => {
        this.allAirports = airports;
      },
      error: (err: any) => {
        console.error('Failed to load airports', err);
      }
    });
  }

  onFromFocus() {
    this.showFromDropdown = true;
    if (!this.searchForm.from) {
      this.filteredFromAirports = this.allAirports;
    } else {
      this.filterAirports('from');
    }
  }

  onToFocus() {
    this.showToDropdown = true;
    if (!this.searchForm.to) {
      this.filteredToAirports = this.allAirports;
    } else {
      this.filterAirports('to');
    }
  }

  filterAirports(field: string) {
    const query = field === 'from' ? this.searchForm.from.toLowerCase() : this.searchForm.to.toLowerCase();
    
    if (!query) {
      if (field === 'from') {
        this.filteredFromAirports = this.allAirports;
      } else {
        this.filteredToAirports = this.allAirports;
      }
    } else {
      const filtered = this.allAirports.filter(airport =>
        airport.code.toLowerCase().includes(query) ||
        airport.city.toLowerCase().includes(query) ||
        airport.country.toLowerCase().includes(query)
      );
      
      if (field === 'from') {
        this.filteredFromAirports = filtered;
      } else {
        this.filteredToAirports = filtered;
      }
    }
  }

  selectAirport(field: string, airport: any) {
    if (field === 'from') {
      this.searchForm.from = airport.code;
      this.showFromDropdown = false;
    } else {
      this.searchForm.to = airport.code;
      this.showToDropdown = false;
    }
  }

  closeFromDropdown() {
    this.showFromDropdown = false;
  }

  closeToDropdown() {
    this.showToDropdown = false;
  }

  search() {
    if (!this.searchForm.from || !this.searchForm.to || !this.searchForm.date) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';
    this.searched = true;
    this.alternativeDates = [];

    this.flightService.searchFlights(this.searchForm).subscribe({
      next: (data: any) => {
        this.results = data.trips || data;
        this.alternativeDates = data.alternativeDates || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Search failed';
        this.loading = false;
      }
    });
  }

  selectAlternativeDate(date: string) {
    this.searchForm.date = date;
    this.search();
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString();
  }

  bookFlight(trip: any) {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
    this.router.navigate(['/booking']);
  }
}
