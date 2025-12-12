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
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Model:</label>
            <input 
              type="text" 
              [(ngModel)]="newAircraft.model" 
              name="model" 
              placeholder="e.g., Boeing 737"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Total Capacity:</label>
            <input 
              type="number" 
              [(ngModel)]="newAircraft.totalCapacity" 
              name="capacity"
              placeholder="e.g., 180"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              required>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Manufacturer:</label>
            <input 
              type="text" 
              [(ngModel)]="newAircraft.manufacturer" 
              name="manufacturer"
              placeholder="e.g., Boeing"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>
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
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Manufacturer</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Capacity</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Status</th>
                <th class="px-6 py-3 text-left text-sm font-semibold text-sky-900">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let plane of aircraft" class="border-b border-gray-200 hover:bg-sky-50 transition">
                <td class="px-6 py-4 font-semibold text-gray-700">{{ plane.model }}</td>
                <td class="px-6 py-4 text-gray-700">{{ plane.manufacturer }}</td>
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
  newAircraft = { model: '', totalCapacity: 0, manufacturer: '' };
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
    if (!this.newAircraft.model || !this.newAircraft.totalCapacity) {
      this.error = 'Model and capacity required';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.airlineService.createAircraft(this.newAircraft).subscribe({
      next: () => {
        this.success = 'Aircraft added successfully!';
        this.newAircraft = { model: '', totalCapacity: 0, manufacturer: '' };
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
