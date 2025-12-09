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
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold mb-6">Search Flights</h2>
      
      <form (ngSubmit)="search()" class="bg-white p-8 rounded-lg shadow-md mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div class="relative airport-input">
            <label class="block text-sm font-medium mb-2">From:</label>
            <input 
              type="text" 
              [(ngModel)]="searchForm.from" 
              (input)="filterAirports('from')"
              (focus)="onFromFocus()"
              (blur)="closeFromDropdown()"
              name="from" 
              placeholder="e.g. NYC, JFK"
              autocomplete="off"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
            <div *ngIf="showFromDropdown && filteredFromAirports.length > 0" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
              <div *ngFor="let airport of filteredFromAirports" 
                (mousedown)="$event.preventDefault()"
                (click)="selectAirport('from', airport)"
                class="px-4 py-2 hover:bg-blue-100 cursor-pointer">
                {{ airport.code }} - {{ airport.city }}, {{ airport.country }}
              </div>
            </div>
          </div>
          
          <div class="relative airport-input">
            <label class="block text-sm font-medium mb-2">To:</label>
            <input 
              type="text" 
              [(ngModel)]="searchForm.to" 
              (input)="filterAirports('to')"
              (focus)="onToFocus()"
              (blur)="closeToDropdown()"
              name="to" 
              placeholder="e.g. LAX, Los Angeles"
              autocomplete="off"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required>
            <div *ngIf="showToDropdown && filteredToAirports.length > 0" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
              <div *ngFor="let airport of filteredToAirports" 
                (mousedown)="$event.preventDefault()"
                (click)="selectAirport('to', airport)"
                class="px-4 py-2 hover:bg-blue-100 cursor-pointer">
                {{ airport.code }} - {{ airport.city }}, {{ airport.country }}
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Date:</label>
            <input type="date" [(ngModel)]="searchForm.date" name="date" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Passengers:</label>
            <input type="number" [(ngModel)]="searchForm.passengers" name="passengers" min="1" max="9" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Class:</label>
            <select [(ngModel)]="searchForm.class" name="class" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>economy</option>
              <option>business</option>
              <option>first</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">Sort by:</label>
            <select [(ngModel)]="searchForm.sort" name="sort" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="price">Price</option>
              <option value="duration">Duration</option>
              <option value="departure">Departure</option>
              <option value="stops">Stops</option>
            </select>
          </div>
        </div>
        
        <button [disabled]="loading" class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition">
          {{ loading ? 'Searching...' : 'Search Flights' }}
        </button>
      </form>
      
      <div *ngIf="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">{{ error }}</div>
      
      <!-- Alternative dates suggestion -->
      <div *ngIf="searched && !loading && results.length === 0 && alternativeDates.length > 0" class="bg-blue-50 border border-blue-300 p-6 rounded-lg mb-6">
        <p class="text-blue-800 font-semibold mb-3">No flights found for your selected date. Try these alternative dates:</p>
        <div class="flex flex-wrap gap-2">
          <button *ngFor="let altDate of alternativeDates" 
            (click)="selectAlternativeDate(altDate.date)"
            class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition">
            {{ altDate.date }} ({{ altDate.flights }} flights)
          </button>
        </div>
      </div>
      
      <!-- Results -->
      <div *ngIf="results && results.length > 0" class="space-y-4">
        <h3 class="text-xl font-bold">Results ({{ results.length }} found)</h3>
        
        <div *ngFor="let trip of results" class="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div class="mb-4">
            <span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {{ trip.stops === 0 ? 'Direct' : trip.stops + ' Stop(s)' }}
            </span>
          </div>
          
          <div class="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div>
              <strong class="text-gray-600">Total Price:</strong>
              <p class="text-2xl font-bold text-green-600">\${{ trip.totalPrice | number:'1.2-2' }}</p>
              <p class="text-gray-500">\${{ trip.pricePerPerson | number:'1.2-2' }}/person</p>
            </div>
            <div>
              <strong class="text-gray-600">Duration:</strong>
              <p class="text-lg">{{ trip.totalDuration }} min</p>
            </div>
          </div>
          
          <div class="border-t pt-4 mb-4 space-y-3">
            <div *ngFor="let flight of trip.flights; let i = index" class="text-sm">
              <p class="font-bold text-gray-800">Flight {{ i + 1 }}: {{ flight.flightNumber }}</p>
              <p class="text-gray-600">{{ flight.airline.name }} ({{ flight.airline.code }})</p>
              <p class="text-gray-600">{{ formatDate(flight.departure.time) }} {{ flight.departure.airport.code }} → {{ formatDate(flight.arrival.time) }} {{ flight.arrival.airport.code }}</p>
              <p class="text-gray-500">{{ flight.aircraft }} | {{ flight.availableSeats }} seats available</p>
            </div>
          </div>
          
          <button (click)="bookFlight(trip)" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition">
            {{ authService.isAuthenticated() ? 'Book Now' : 'Login to Book' }}
          </button>
        </div>
      </div>
      
      <div *ngIf="searched && !loading && results.length === 0" class="bg-gray-100 p-8 rounded-lg text-center">
        <p class="text-gray-600 text-lg">No flights found for your search criteria.</p>
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

  // Autocomplete properties
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
    // Close dropdowns if click is outside the search inputs
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

    // Store trip in session/state and navigate to booking
    sessionStorage.setItem('selectedTrip', JSON.stringify(trip));
    this.router.navigate(['/booking']);
  }
}
