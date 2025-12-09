import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AirlineService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  /**
   * Get routes for airline
   * GET /api/routes
   */
  getRoutes(page?: number, limit?: number): Observable<any> {
    let queryString = '';
    if (page) queryString += `?page=${page}`;
    if (limit) queryString += `${page ? '&' : '?'}limit=${limit}`;

    return this.http.get<any>(`${this.apiUrl}/routes${queryString}`);
  }

  /**
   * Get route by ID
   * GET /api/routes/:id
   */
  getRouteById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/routes/${id}`);
  }

  /**
   * Create new route
   * POST /api/routes
   */
  createRoute(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/routes`, data);
  }

  /**
   * Update route
   * PUT /api/routes/:id
   */
  updateRoute(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/routes/${id}`, data);
  }

  /**
   * Get aircraft for airline
   * GET /api/aircraft
   */
  getAircraft(page?: number, limit?: number): Observable<any> {
    let queryString = '';
    if (page) queryString += `?page=${page}`;
    if (limit) queryString += `${page ? '&' : '?'}limit=${limit}`;

    return this.http.get<any>(`${this.apiUrl}/aircraft${queryString}`);
  }

  /**
   * Get aircraft by ID
   * GET /api/aircraft/:id
   */
  getAircraftById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/aircraft/${id}`);
  }

  /**
   * Create new aircraft
   * POST /api/aircraft
   */
  createAircraft(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/aircraft`, data);
  }

  /**
   * Update aircraft
   * PUT /api/aircraft/:id
   */
  updateAircraft(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/aircraft/${id}`, data);
  }

  /**
   * Get airlines
   * GET /api/airlines
   */
  getAirlines(page?: number, limit?: number): Observable<any> {
    let queryString = '';
    if (page) queryString += `?page=${page}`;
    if (limit) queryString += `${page ? '&' : '?'}limit=${limit}`;

    return this.http.get<any>(`${this.apiUrl}/airlines${queryString}`);
  }

  /**
   * Get airline by ID
   * GET /api/airlines/:id
   */
  getAirlineById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/airlines/${id}`);
  }

  /**
   * Create airline (admin only)
   * POST /api/airlines
   */
  createAirline(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/airlines`, data);
  }

  /**
   * Update airline info
   * PUT /api/airlines/:id
   */
  updateAirline(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/airlines/${id}`, data);
  }

  /**
   * Get users (admin only)
   * GET /api/users
   */
  getUsers(page?: number, limit?: number): Observable<any> {
    let queryString = '';
    if (page) queryString += `?page=${page}`;
    if (limit) queryString += `${page ? '&' : '?'}limit=${limit}`;

    return this.http.get<any>(`${this.apiUrl}/users${queryString}`);
  }

  /**
   * Delete user (admin only)
   * DELETE /api/users/:id
   */
  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`);
  }
}
