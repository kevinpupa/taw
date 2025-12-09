import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Ticket {
  _id: string;
  bookingReference: string;
  passenger: string;
  flight: any;
  ticketClass: string;
  seatNumber: string;
  status: string;
  passengerDetails: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    passportNumber: string;
  };
  pricing: {
    basePrice: number;
    extrasPrice: number;
    totalPrice: number;
  };
  extras: {
    extraLegroom: boolean;
    extraBaggage: boolean;
    extraBaggageCount: number;
    specialMeal: string;
  };
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private apiUrl = 'http://localhost:3000/api/tickets';

  constructor(private http: HttpClient) { }

  /**
   * Get all tickets for current user
   * GET /api/tickets
   */
  getUserTickets(page?: number, limit?: number): Observable<any> {
    let queryString = '';
    if (page) queryString += `?page=${page}`;
    if (limit) queryString += `${page ? '&' : '?'}limit=${limit}`;

    return this.http.get<any>(`${this.apiUrl}${queryString}`);
  }

  /**
   * Get ticket by ID or booking reference
   * GET /api/tickets/:identifier
   */
  getTicketById(identifier: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/${identifier}`);
  }

  /**
   * Purchase a ticket (create booking)
   * POST /api/tickets
   */
  purchaseTicket(data: {
    flightId: string;
    ticketClass: string;
    seatNumber: string;
    passengerDetails: {
      fullName: string;
      email: string;
      phone?: string;
      dateOfBirth?: string;
      passportNumber?: string;
    };
    extras?: {
      extraBaggage?: boolean;
      extraBaggageCount?: number;
      extraLegroom?: boolean;
      specialMeal?: string;
    };
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, data);
  }

  /**
   * Cancel a ticket
   * POST /api/tickets/:id/cancel
   */
  cancelTicket(ticketId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${ticketId}/cancel`, {});
  }

  /**
   * Check seat availability for a flight
   * GET /api/tickets/availability/:flightId
   */
  checkSeatAvailability(flightId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/availability/${flightId}`);
  }
}
