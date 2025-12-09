# Flight Booking Frontend - Implementation Summary

## Overview

A simplified, functional Angular SPA frontend for the flight booking system that integrates with your Node.js/Express backend. The frontend is built with **standalone Angular components** and uses **basic CSS styling** (no frameworks) for simplicity.

## Project Structure

```
src/frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── search/
│   │   │   ├── booking/
│   │   │   ├── my-tickets/
│   │   │   ├── airline-dashboard/
│   │   │   ├── airline-routes/
│   │   │   ├── airline-aircraft/
│   │   │   ├── airline-flights/
│   │   │   ├── airline-statistics/
│   │   │   ├── admin-users/
│   │   │   └── admin-airlines/
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── flight.service.ts
│   │   │   ├── ticket.service.ts
│   │   │   └── airline.service.ts
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts
│   │   ├── app.component.ts
│   │   ├── app.routes.ts
│   │   └── app.config.ts
│   ├── styles.css
│   ├── index.html
│   └── main.ts
├── package.json
├── tsconfig.json
├── angular.json
├── Dockerfile
└── README.md
```

## Key Components

### 1. Authentication Components
- **LoginComponent**: Login with email/password
- **RegisterComponent**: Register as passenger
- **AuthService**: Handles login, registration, token management
- **AuthInterceptor**: Automatically adds JWT token to requests
- **AuthGuard/AirlineGuard/AdminGuard**: Route protection

### 2. Public Components
- **SearchComponent**: Search flights without authentication
  - Filter by origin, destination, date, passengers, class
  - Sort by price, duration, departure, stops
  - Display results with real-time seat availability
  - Direct flight + connecting flight search

### 3. Passenger Components
- **BookingComponent**: Book flights
  - Seat selection with visual grid
  - Extra selections (legroom, baggage, special meals)
  - Pricing calculation
  - Passenger details form

- **MyTicketsComponent**: View and manage tickets
  - List all passenger tickets
  - Cancel tickets (if allowed)
  - Display booking references and pricing

### 4. Airline Components
- **AirlineDashboardComponent**: Hub for airline operations
- **AirlineRoutesComponent**: Create and manage routes
- **AirlineAircraftComponent**: Add and manage aircraft fleet
- **AirlineFlightsComponent**: Create and schedule flights
  - Set pricing for each class
  - View bookings per flight
  - Cancel flights

- **AirlineStatisticsComponent**: Analytics
  - Total passengers and revenue
  - Average occupancy rate
  - Most popular routes

### 5. Admin Components
- **AdminUsersComponent**: User management
  - List all users
  - Delete users

- **AdminAirlinesComponent**: Airline management
  - Create airlines
  - View airline details

## Services

### AuthService
- `login()`: Authenticate user
- `register()`: Register new passenger
- `logout()`: Clear auth state
- `isAuthenticated()`: Check if user has token
- `hasRole()`: Check user role
- `getCurrentUser()`: Get current user object
- `getToken()`: Get JWT token

### FlightService
- `searchFlights()`: Search with filters and sorting
- `getAvailableAirports()`: Get airport list
- `getFlightAvailability()`: Real-time seat availability
- `getFlights()`, `getFlightById()`: Fetch flight details
- `createFlight()`, `updateFlight()`: Flight management
- `cancelFlight()`: Cancel flight
- `getFlightStats()`: Revenue, passengers, route analytics

### TicketService
- `getUserTickets()`: Get passenger's tickets
- `getTicketById()`: Get ticket details
- `purchaseTicket()`: Book flight
- `cancelTicket()`: Cancel booking
- `checkSeatAvailability()`: Real-time seat info

### AirlineService
- Routes management: `getRoutes()`, `createRoute()`, `updateRoute()`
- Aircraft management: `getAircraft()`, `createAircraft()`, `updateAircraft()`
- Airlines management: `getAirlines()`, `createAirline()`, `updateAirline()`
- Users management: `getUsers()`, `deleteUser()`

## Features Implemented

✅ **Authentication**
- Register as passenger
- Login (airlines and passengers)
- JWT token management
- Role-based route protection (passenger, airline, admin)
- Logout functionality

✅ **Flight Search**
- Public search without authentication
- Filter by origin, destination, date, passengers, class
- Sort by price, duration, departure, stops
- Display direct and connecting flights
- Real-time seat availability check

✅ **Booking Flow**
- Select flight from search results
- Choose seat from visual grid
- Select extras (baggage, legroom, special meals)
- Enter passenger details
- Submit booking with transaction handling

✅ **Ticket Management**
- View all booked tickets
- Cancel tickets (with 24-hour restriction check)
- Display booking reference and pricing

✅ **Airline Dashboard**
- Create routes (origin, destination, duration)
- Add aircraft to fleet (model, capacity)
- Schedule flights (assign route+aircraft+time, set pricing)
- View statistics (passengers, revenue, popular routes)
- Cancel flights (cascades to bookings)

✅ **Admin Panel**
- List and delete users
- Create and manage airlines
- Set temporary passwords for airlines

## Styling

- **No CSS framework** - Uses vanilla CSS with Tailwind-like utility classes
- **Responsive design** - Mobile-first approach
- **Simple cards and forms** - Clean, functional UI
- **Alert messages** - Success, error, warning, info states
- **Tables and grids** - For data display
- **Seat selection grid** - Visual seat picker with status indicators

## API Integration

All services communicate with backend at `http://localhost:3000/api`:

**Public Endpoints**:
- `GET /search/flights` - Search flights
- `GET /search/airports` - Available airports

**Auth Endpoints**:
- `POST /auth/register` - Register passenger
- `POST /auth/login` - Login
- `POST /auth/change-password` - Change password

**Flight Endpoints**:
- `GET /flights` - List airline flights
- `POST /flights` - Create flight
- `GET /tickets/availability/:flightId` - Seat availability

**Booking Endpoints**:
- `GET /tickets` - Get passenger tickets
- `POST /tickets` - Book ticket
- `POST /tickets/:id/cancel` - Cancel ticket

**Airline Endpoints**:
- `GET /routes`, `POST /routes` - Routes management
- `GET /aircraft`, `POST /aircraft` - Aircraft management
- `GET /flights/stats` - Statistics

**Admin Endpoints**:
- `GET /users`, `DELETE /users/:id` - User management
- `GET /airlines`, `POST /airlines` - Airline management

## Running the Frontend

### Local Development
```bash
cd src/frontend
npm install
npm start
```
Navigate to `http://localhost:4200`

### Docker
```bash
cd src/frontend
docker build -t flight-booking-frontend .
docker run -p 4200:4200 flight-booking-frontend
```

## Environment Setup

The frontend expects:
- Backend running at `http://localhost:3000`
- CORS enabled on backend
- All API endpoints properly secured with authentication

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Notes for University Project

✅ **Simple & Functional**: Designed for academic submission, not production
✅ **Well-Documented**: Code includes inline comments and service documentation
✅ **Standards Compliant**: Follows Angular best practices (standalone components)
✅ **RESTful Integration**: Works with provided backend
✅ **Complete Feature Set**: Covers all project requirements
✅ **Responsive Design**: Works on desktop and mobile
✅ **Role-Based**: Different UIs for passengers, airlines, admins
✅ **Proper State Management**: Auth service manages user state
✅ **Error Handling**: All API calls include error handling with user feedback

## Common Issues & Solutions

**CORS Errors**: Ensure backend has CORS enabled
```javascript
// In backend server.js
app.use(cors());
```

**Token Not Persisting**: Frontend saves token to localStorage automatically

**Routes Not Working**: Ensure auth guard is properly protecting routes
