import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SeatWebSocketService {
  private socket: Socket | null = null;
  private seatUpdates = new Subject<any>();
  private connectionStatus = new Subject<boolean>();
  private apiUrl = 'http://localhost:3000';

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    this.socket = io(this.apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      this.connectionStatus.next(false);
    });

    this.socket.on('error', (error: any) => {
      console.error('[WebSocket] Error:', error);
    });
  }

  /**
   * Join a flight's seat update room
   * Automatically subscribes to seat availability updates for that flight
   */
  joinFlight(flightId: string): Observable<any> {
    if (this.socket) {
      // Request the namespace
      const seatsNamespace = io(`${this.apiUrl}/seats`, {
        transports: ['websocket', 'polling'],
        reconnection: true
      });

      // Join the flight room
      seatsNamespace.emit('join-flight', { flightId });

      // Listen for seat updates on this namespace
      seatsNamespace.on('seats-update', (data: any) => {
        this.seatUpdates.next(data);
      });

      seatsNamespace.on('error', (error: any) => {
        console.error('[WebSocket] Error joining flight:', error);
      });
    }

    return this.seatUpdates.asObservable();
  }

  /**
   * Leave a flight's seat update room
   */
  leaveFlight(flightId: string) {
    if (this.socket) {
      this.socket.emit('leave-flight', { flightId });
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
