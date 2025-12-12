import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold mb-8 text-gray-800">My Tickets</h2>
      
      <div *ngIf="loading" class="alert alert-info">Loading tickets...</div>
      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      
      <div *ngIf="!loading && tickets.length > 0" class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Flight</th>
              <th>Airline</th>
              <th>Date</th>
              <th>Route</th>
              <th>Seat</th>
              <th>Status</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ticket of tickets">
              <td class="font-mono text-sm">{{ ticket.bookingReference }}</td>
              <td>{{ ticket.flight?.flightNumber }}</td>
              <td>{{ ticket.flight?.airline?.name }}</td>
              <td>{{ formatDate(ticket.flight?.departureTime) }}</td>
              <td>{{ ticket.flight?.route?.departureAirport?.code }} → {{ ticket.flight?.route?.arrivalAirport?.code }}</td>
              <td>{{ ticket.seatNumber }}</td>
              <td><span class="px-2 py-1 bg-sky-100 text-sky-800 rounded text-sm">{{ ticket.status }}</span></td>
              <td class="font-semibold">{{ ticket.pricing?.totalPrice | currency }}</td>
              <td>
                <button 
                  *ngIf="ticket.status === 'confirmed'" 
                  (click)="cancelTicket(ticket._id)"
                  class="btn-danger text-sm py-1 px-3"
                  [disabled]="cancelingId === ticket._id">
                  {{ cancelingId === ticket._id ? 'Canceling...' : 'Cancel' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div *ngIf="!loading && tickets.length === 0" class="empty-state">
        <p>You don't have any tickets yet.</p>
      </div>
    </div>
  `
})
export class MyTicketsComponent implements OnInit {
  tickets: any[] = [];
  loading = true;
  error = '';
  cancelingId = '';

  constructor(private ticketService: TicketService) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketService.getUserTickets().subscribe({
      next: (response: any) => {
        this.tickets = response.tickets || response;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to load tickets';
        this.loading = false;
      }
    });
  }

  cancelTicket(ticketId: string): void {
    if (!confirm('Are you sure you want to cancel this ticket?')) return;

    this.cancelingId = ticketId;

    this.ticketService.cancelTicket(ticketId).subscribe({
      next: () => {
        alert('Ticket cancelled successfully');
        this.loadTickets();
      },
      error: (err: any) => {
        this.error = err.error?.error?.message || 'Failed to cancel ticket';
        this.cancelingId = '';
      }
    });
  }

  formatDate(date: any): string {
    return new Date(date).toLocaleString();
  }
}
