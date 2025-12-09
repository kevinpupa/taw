import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AirlineService } from '../../services/airline.service';

@Component({
  selector: 'app-admin-airlines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="max-width: 1000px; margin: 0 auto;">
      <h2>Airline Management</h2>
      
      <form (ngSubmit)="createAirline()" class="card">
        <h3>Create New Airline</h3>
        
        <div class="grid-2">
          <div>
            <label>Airline Name:</label>
            <input type="text" [(ngModel)]="newAirline.name" name="name" required>
          </div>
          
          <div>
            <label>Airline Code:</label>
            <input type="text" [(ngModel)]="newAirline.code" name="code" maxlength="3" required>
          </div>
          
          <div>
            <label>Email:</label>
            <input type="email" [(ngModel)]="newAirline.email" name="email" required>
          </div>
          
          <div></div>
        </div>
        
        <button [disabled]="loading">{{ loading ? 'Creating...' : 'Create Airline' }}</button>
      </form>
      
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>
      
      <div *ngIf="airlines.length > 0">
        <h3>Airlines</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let airline of airlines">
              <td>{{ airline.name }}</td>
              <td>{{ airline.code }}</td>
              <td>{{ airline.email }}</td>
              <td>{{ airline.isActive ? 'Active' : 'Inactive' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminAirlinesComponent implements OnInit {
  airlines: any[] = [];
  newAirline = { name: '', code: '', email: '' };
  loading = false;
  error = '';
  success = '';

  constructor(private airlineService: AirlineService) {}

  ngOnInit() {
    this.loadAirlines();
  }

  loadAirlines(): void {
    this.airlineService.getAirlines().subscribe({
      next: (response: any) => {
        this.airlines = response.airlines || response;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load airlines';
      }
    });
  }

  createAirline(): void {
    if (!this.newAirline.name || !this.newAirline.code || !this.newAirline.email) {
      this.error = 'Please fill in all required fields';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.airlineService.createAirline(this.newAirline).subscribe({
      next: () => {
        this.success = 'Airline created successfully!';
        this.newAirline = { name: '', code: '', email: '' };
        this.loadAirlines();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to create airline';
        this.loading = false;
      }
    });
  }
}
