import { Routes } from '@angular/router';
import { AuthGuard, AirlineGuard, AdminGuard } from './guards/auth.guard';

// Components will be imported when created
// import { LoginComponent } from './components/login/login.component';
// ... etc

export const routes: Routes = [
  { path: '', redirectTo: '/search', pathMatch: 'full' },
  
  // Auth routes
  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'change-password', canActivate: [AuthGuard], loadComponent: () => import('./components/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
  
  // Public routes
  { path: 'search', loadComponent: () => import('./components/search/search.component').then(m => m.SearchComponent) },
  
  // Passenger routes (authenticated)
  { 
    path: 'booking', 
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/booking/booking.component').then(m => m.BookingComponent) 
  },
  { 
    path: 'my-tickets', 
    canActivate: [AuthGuard],
    loadComponent: () => import('./components/my-tickets/my-tickets.component').then(m => m.MyTicketsComponent) 
  },
  
  // Airline routes (authenticated + airline role)
  { 
    path: 'airline/dashboard', 
    canActivate: [AuthGuard, AirlineGuard],
    loadComponent: () => import('./components/airline-dashboard/airline-dashboard.component').then(m => m.AirlineDashboardComponent) 
  },
  { 
    path: 'airline/routes', 
    canActivate: [AuthGuard, AirlineGuard],
    loadComponent: () => import('./components/airline-routes/airline-routes.component').then(m => m.AirlineRoutesComponent) 
  },
  { 
    path: 'airline/aircraft', 
    canActivate: [AuthGuard, AirlineGuard],
    loadComponent: () => import('./components/airline-aircraft/airline-aircraft.component').then(m => m.AirlineAircraftComponent) 
  },
  { 
    path: 'airline/flights', 
    canActivate: [AuthGuard, AirlineGuard],
    loadComponent: () => import('./components/airline-flights/airline-flights.component').then(m => m.AirlineFlightsComponent) 
  },
  { 
    path: 'airline/statistics', 
    canActivate: [AuthGuard, AirlineGuard],
    loadComponent: () => import('./components/airline-statistics/airline-statistics.component').then(m => m.AirlineStatisticsComponent) 
  },
  
  // Admin routes
  { 
    path: 'admin/users', 
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./components/admin-users/admin-users.component').then(m => m.AdminUsersComponent) 
  },
  { 
    path: 'admin/airlines', 
    canActivate: [AuthGuard, AdminGuard],
    loadComponent: () => import('./components/admin-airlines/admin-airlines.component').then(m => m.AdminAirlinesComponent) 
  },
  
  // Fallback route
  { path: '**', redirectTo: '/search' }
];
