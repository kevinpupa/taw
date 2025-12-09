import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AirlineService } from '../../services/airline.service';

@Component({
  selector: 'app-airline-aircraft',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2>Manage Aircraft</h2>
      
      <form (ngSubmit)="createAircraft()" class="card">
        <h3>Add Aircraft</h3>
        
        <div class="grid-2">
          <div>
            <label>Model:</label>
            <input type="text" [(ngModel)]="newAircraft.model" name="model" placeholder="e.g., Boeing 737" required>
          </div>
          
          <div>
            <label>Total Capacity:</label>
            <input type="number" [(ngModel)]="newAircraft.totalCapacity" name="capacity" required>
          </div>
          
          <div>
            <label>Manufacturer:</label>
            <input type="text" [(ngModel)]="newAircraft.manufacturer" name="manufacturer">
          </div>
          
          <div></div>
        </div>
        
        <button [disabled]="loading">{{ loading ? 'Creating...' : 'Add Aircraft' }}</button>
      </form>
      
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>
      
      <div *ngIf="aircraft.length > 0">
        <h3>Your Aircraft</h3>
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Manufacturer</th>
              <th>Capacity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let plane of aircraft">
              <td>{{ plane.model }}</td>
              <td>{{ plane.manufacturer }}</td>
              <td>{{ plane.totalCapacity }}</td>
              <td>{{ plane.isActive ? 'Active' : 'Inactive' }}</td>
            </tr>
          </tbody>
        </table>
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
}
