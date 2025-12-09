import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Flight {
  _id: string;
  flightNumber: string;
  airline: { _id: string; name: string; code: string };
  route: { _id: string; departureAirport: any; arrivalAirport: any; duration: number };
  aircraft: { _id: string; model: string; totalCapacity: number };
  departureTime: Date;
  arrivalTime: Date;
  status: string;
  bookedSeats: string[];
  pricing: Array<{ class: string; basePrice: number }>;
  isActive: boolean;
}

export interface FlightTrip {
  type: string;
  stops: number;
  totalDuration: number;
  totalPrice: number;
  pricePerPerson: number;
  flights: Flight[];
}

export interface SeatAvailability {
  flightId: string;
  seatMap: any[];
  availabilityByClass: { [key: string]: { total: number; available: number } };
  totalSeats: number;
  bookedSeats: number;
  availableSeats: number;
}

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  /**
   * Search for flights
   * GET /api/search/flights
   */
  searchFlights(params: {
    from: string;
    to: string;
    date: string;
    passengers?: number;
    class?: string;
    sort?: string;
    order?: string;
    maxStops?: number;
  }): Observable<FlightTrip[]> {
    let queryString = `?from=${params.from}&to=${params.to}&date=${params.date}`;
    
    if (params.passengers) queryString += `&passengers=${params.passengers}`;
    if (params.class) queryString += `&class=${params.class}`;
    if (params.sort) queryString += `&sort=${params.sort}`;
    if (params.order) queryString += `&order=${params.order}`;
    if (params.maxStops !== undefined) queryString += `&maxStops=${params.maxStops}`;

    return this.http.get<FlightTrip[]>(`${this.apiUrl}/search/flights${queryString}`);
  }

  /**
   * Get available airports for search
   * GET /api/search/airports
   */
  getAvailableAirports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search/airports`);
  }

  /**
   * Get seat availability for a specific flight
   * GET /api/tickets/availability/:flightId
   */
  getFlightAvailability(flightId: string): Observable<SeatAvailability> {
    return this.http.get<SeatAvailability>(`${this.apiUrl}/tickets/availability/${flightId}`);
  }

  /**
   * Get all flights for airline
   * GET /api/flights
   * (Airline only)
   */
  getFlights(page?: number, limit?: number): Observable<any> {
    let queryString = '';
    if (page) queryString += `?page=${page}`;
    if (limit) queryString += `${page ? '&' : '?'}limit=${limit}`;

    return this.http.get<any>(`${this.apiUrl}/flights${queryString}`);
  }

  /**
   * Get single flight details
   * GET /api/flights/:id
   */
  getFlightById(id: string): Observable<Flight> {
    return this.http.get<Flight>(`${this.apiUrl}/flights/${id}`);
  }

  /**
   * Create new flight
   * POST /api/flights
   * (Airline only)
   */
  createFlight(data: any): Observable<Flight> {
    return this.http.post<Flight>(`${this.apiUrl}/flights`, data);
  }

  /**
   * Update flight
   * PUT /api/flights/:id
   * (Airline only)
   */
  updateFlight(id: string, data: any): Observable<Flight> {
    return this.http.put<Flight>(`${this.apiUrl}/flights/${id}`, data);
  }

  /**
   * Cancel flight
   * POST /api/flights/:id/cancel
   * (Airline only)
   */
  cancelFlight(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/flights/${id}/cancel`, {});
  }

  /**
   * Get flight statistics
   * GET /api/flights/stats/overview
   * (Airline only)
   */
  getFlightStats(airlineId?: string, startDate?: string, endDate?: string): Observable<any> {
    let queryString = '';
    if (airlineId) queryString += `?airlineId=${airlineId}`;
    if (startDate) queryString += `${airlineId ? '&' : '?'}startDate=${startDate}`;
    if (endDate) queryString += `${airlineId || startDate ? '&' : '?'}endDate=${endDate}`;

    return this.http.get<any>(`${this.apiUrl}/flights/stats/overview${queryString}`);
  }
}
