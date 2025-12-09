# Flight Booking Frontend

Simple Angular SPA frontend for the Flight Booking System. This is a minimal, functional implementation designed for university project submission.

## Features

- **Flight Search**: Search flights without authentication
- **User Authentication**: Login/Register for passengers
- **Flight Booking**: Select flights, seats, and extras
- **My Tickets**: View and cancel booked tickets
- **Airline Dashboard**: Manage routes, aircraft, and flights
- **Statistics**: View passenger and revenue statistics
- **Admin Panel**: Manage users and airlines

## Installation

```bash
# Install dependencies
npm install

# Development server
npm start

# Build for production
npm run build
```

## Development

Navigate to `http://localhost:4200`. The app will automatically reload if you change any of the source files.

## Architecture

- **Services**: API communication (auth, flight, ticket, airline)
- **Guards**: Route protection (authentication, role-based)
- **Interceptors**: Automatic JWT token attachment
- **Components**: Standalone Angular components for each feature

## API Integration

Frontend expects backend at `http://localhost:3000/api`

Ensure backend is running with:
- Authentication endpoints
- Flight search endpoints
- Booking/ticket endpoints
- Admin endpoints

## Docker

Build and run in Docker:

```bash
docker build -t flight-booking-frontend .
docker run -p 4200:4200 flight-booking-frontend
```

## Components

- **Login/Register**: Authentication
- **Search**: Public flight search
- **Booking**: Purchase tickets
- **MyTickets**: Passenger tickets management
- **AirlineDashboard**: Airline management hub
- **AirlineRoutes/Aircraft/Flights**: Airline CRUD operations
- **AirlineStatistics**: Revenue and passenger analytics
- **AdminUsers/Airlines**: Admin management panels

## Notes

- Application uses simple styling with CSS (no Bootstrap/Material)
- Uses Angular standalone components (no NgModules)
- Responsive design for mobile and desktop
- JWT tokens stored in localStorage
