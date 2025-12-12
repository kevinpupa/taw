import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AirlineService } from '../../services/airline.service';

@Component({
  selector: 'app-airline-aircraft',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold mb-8 text-sky-900">Manage Aircraft</h2>
      
      <form (ngSubmit)="createAircraft()" class="card mb-8">
        <h3 class="text-2xl font-semibold text-sky-800 mb-6">Add Aircraft</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <input 
              type="text" 
              [(ngModel)]="newAircraft.model" 
              name="model" 
              placeholder="e.g., Boeing 737"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
            <input 
              type="text" 
              [(ngModel)]="newAircraft.registrationNumber" 
              name="registrationNumber" 
              placeholder="e.g., N123AA"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
        </div>

        <div class="mb-6">
          <h4 class="text-lg font-semibold text-sky-800 mb-3">Seat Configuration</h4>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 rounded-lg border bg-gray-50">
              <p class="font-medium text-gray-800 mb-3">Economy</p>
              <label class="block text-sm text-gray-700 mb-1">Rows</label>
              <input type="number" min="0" [(ngModel)]="seatConfig.economy.rows" name="ecoRows"
                     class="w-full px-3 py-2 border rounded-lg mb-2">
              <label class="block text-sm text-gray-700 mb-1">Seats per row</label>
              <input type="number" min="0" max="10" [(ngModel)]="seatConfig.economy.seatsPerRow" name="ecoSpr"
                     class="w-full px-3 py-2 border rounded-lg mb-2">
              <label class="block text-sm text-gray-700 mb-1">Extra legroom rows (comma-separated)</label>
              <input type="text" [(ngModel)]="seatConfig.economy.extraLegroomRowsText" name="ecoXlr"
                     placeholder="e.g., 1,2"
                     class="w-full px-3 py-2 border rounded-lg">
            </div>
            <div class="p-4 rounded-lg border bg-gray-50">
              <p class="font-medium text-gray-800 mb-3">Business</p>
              <label class="block text-sm text-gray-700 mb-1">Rows</label>
              <input type="number" min="0" [(ngModel)]="seatConfig.business.rows" name="busRows"
                     class="w-full px-3 py-2 border rounded-lg mb-2">
              <label class="block text-sm text-gray-700 mb-1">Seats per row</label>
              <input type="number" min="0" max="10" [(ngModel)]="seatConfig.business.seatsPerRow" name="busSpr"
                     class="w-full px-3 py-2 border rounded-lg mb-2">
              <label class="block text-sm text-gray-700 mb-1">Extra legroom rows (comma-separated)</label>
              <input type="text" [(ngModel)]="seatConfig.business.extraLegroomRowsText" name="busXlr"
                     placeholder="e.g., 1"
                     class="w-full px-3 py-2 border rounded-lg">
            </div>
            <div class="p-4 rounded-lg border bg-gray-50">
              <p class="font-medium text-gray-800 mb-3">First</p>
              <label class="block text-sm text-gray-700 mb-1">Rows</label>
              <input type="number" min="0" [(ngModel)]="seatConfig.first.rows" name="firRows"
                     class="w-full px-3 py-2 border rounded-lg mb-2">
              <label class="block text-sm text-gray-700 mb-1">Seats per row</label>
              <input type="number" min="0" max="10" [(ngModel)]="seatConfig.first.seatsPerRow" name="firSpr"
                     class="w-full px-3 py-2 border rounded-lg mb-2">
              <label class="block text-sm text-gray-700 mb-1">Extra legroom rows (comma-separated)</label>
              <input type="text" [(ngModel)]="seatConfig.first.extraLegroomRowsText" name="firXlr"
                     class="w-full px-3 py-2 border rounded-lg">
            </div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Capacity is calculated automatically from rows × seats per row.</p>
        </div>
        
        <button 
          [disabled]="loading"
          class="btn btn-primary w-full md:w-auto">
          {{ loading ? 'Creating...' : 'Add Aircraft' }}
        </button>
      </form>
      
      <div *ngIf="error" class="alert alert-error mb-6">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success mb-6">{{ success }}</div>
      
      <div *ngIf="aircraft.length > 0" class="card">
        <h3 class="text-2xl font-semibold text-sky-800 mb-6">Your Aircraft</h3>
        <p class="text-sm text-red-600 mb-4">Warning: Deleting an aircraft will also remove all flights operated by this aircraft.</p>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-sky-100 border-b border-sky-300">
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Model</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Reg. No.</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Capacity</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Status</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let plane of aircraft" class="border-b border-gray-200 hover:bg-sky-50 transition">
                <td class="px-6 py-4 font-semibold text-gray-700">{{ plane.model }}</td>
                <td class="px-6 py-4 text-gray-700">{{ plane.registrationNumber }}</td>
                <td class="px-6 py-4 text-gray-700">{{ plane.totalCapacity }}</td>
                <td class="px-6 py-4">
                  <span [class]="plane.isActive ? 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium' : 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium'">
                    {{ plane.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                          title="Deletes aircraft and all its flights"
                          (click)="deleteAircraft(plane._id)">
                    Delete (removes flights)
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="aircraft.length === 0 && !loading" class="card text-center py-12">
        <p class="text-gray-500 text-lg">No aircraft added yet. Add your first aircraft above!</p>
      </div>
    </div>
  `
})
export class AirlineAircraftComponent implements OnInit {
  aircraft: any[] = [];
  newAircraft = { model: '', registrationNumber: '' } as any;
  seatConfig = {
    economy: { rows: 20, seatsPerRow: 6, extraLegroomRowsText: '' },
    business: { rows: 8, seatsPerRow: 4, extraLegroomRowsText: '' },
    first: { rows: 4, seatsPerRow: 4, extraLegroomRowsText: '' }
  } as any;
  loading = false;
  error = '';
  success = '';

  constructor(private airlineService: AirlineService) {}

  ngOnInit() {
    this.loadAircraft();
  }

  loadAircraft(): void {
    this.airlineService.getAircraft().subscribe({
      next: (response: any) => {
        this.aircraft = response.aircraft || response;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load aircraft';
      }
    });
  }

  createAircraft(): void {
    if (!this.newAircraft.model || !this.newAircraft.registrationNumber) {
      this.error = 'Model and registration number are required';
      return;
    }

    // Build seatConfiguration array from UI inputs
    const parseRows = (txt: string) => txt
      ? txt.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n) && n > 0)
      : [];

    const seatConfiguration: any[] = [];
    const cfg = this.seatConfig;
    if (cfg.economy.rows > 0 && cfg.economy.seatsPerRow > 0) {
      seatConfiguration.push({ class: 'economy', rows: cfg.economy.rows, seatsPerRow: cfg.economy.seatsPerRow, extraLegroomRows: parseRows(cfg.economy.extraLegroomRowsText) });
    }
    if (cfg.business.rows > 0 && cfg.business.seatsPerRow > 0) {
      seatConfiguration.push({ class: 'business', rows: cfg.business.rows, seatsPerRow: cfg.business.seatsPerRow, extraLegroomRows: parseRows(cfg.business.extraLegroomRowsText) });
    }
    if (cfg.first.rows > 0 && cfg.first.seatsPerRow > 0) {
      seatConfiguration.push({ class: 'first', rows: cfg.first.rows, seatsPerRow: cfg.first.seatsPerRow, extraLegroomRows: parseRows(cfg.first.extraLegroomRowsText) });
    }

    if (seatConfiguration.length === 0) {
      this.error = 'Please configure at least one cabin with rows and seats per row';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const payload = {
      model: this.newAircraft.model,
      registrationNumber: this.newAircraft.registrationNumber,
      seatConfiguration
    };

    this.airlineService.createAircraft(payload).subscribe({
      next: () => {
        this.success = 'Aircraft added successfully!';
        this.newAircraft = { model: '', totalCapacity: 0, manufacturer: '' };
        this.seatConfig = { economy: { rows: 20, seatsPerRow: 6, extraLegroomRowsText: '' }, business: { rows: 8, seatsPerRow: 4, extraLegroomRowsText: '' }, first: { rows: 4, seatsPerRow: 4, extraLegroomRowsText: '' } };
        this.loadAircraft();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to add aircraft';
        this.loading = false;
      }
    });
  }

  deleteAircraft(id: string): void {
    if (!id) return;
    const confirmed = window.confirm('Delete this aircraft? This will also remove all flights operated by this aircraft. This action cannot be undone.');
    if (!confirmed) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    this.airlineService.deleteAircraft(id).subscribe({
      next: () => {
        this.success = 'Aircraft deleted successfully!';
        this.loadAircraft();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to delete aircraft';
        this.loading = false;
      }
    });
  }
}
