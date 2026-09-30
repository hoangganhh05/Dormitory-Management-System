import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { ClientLayoutComponent } from './features/client/client-layout/client-layout.component';
import { ClientHomeComponent } from './features/client/client-home/client-home.component';
import { ClientRoomsComponent } from './features/client/client-rooms/client-rooms.component';
import { ClientRegisterRoomComponent } from './features/client/client-register-room/client-register-room.component';
import { ClientMaintenanceComponent } from './features/client/client-maintenance/client-maintenance.component';
import { ClientProfileComponent } from './features/client/client-profile/client-profile.component';

import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { AdminRoomsComponent } from './features/admin/admin-rooms/admin-rooms.component';
import { AdminStudentsComponent } from './features/admin/admin-students/admin-students.component';
import { AdminRegistrationsComponent } from './features/admin/admin-registrations/admin-registrations.component';
import { AdminMaintenanceComponent } from './features/admin/admin-maintenance/admin-maintenance.component';
import { AdminNotificationsComponent } from './features/admin/admin-notifications/admin-notifications.component';
import { adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'client/dashboard',
    pathMatch: 'full',
  },
  // Authentication route
  {
    path: 'login',
    component: LoginComponent,
  },
  // Client Portal Routes (Sinh viên)
  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: ClientHomeComponent },
      { path: 'rooms', component: ClientRoomsComponent },
      { path: 'register-room', component: ClientRegisterRoomComponent },
      { path: 'maintenance', component: ClientMaintenanceComponent },
      { path: 'profile', component: ClientProfileComponent },
    ],
  },
  // Admin Portal Routes (Ban Quản lý KTX - Protected by adminGuard)
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'rooms', component: AdminRoomsComponent },
      { path: 'students', component: AdminStudentsComponent },
      { path: 'registrations', component: AdminRegistrationsComponent },
      { path: 'maintenance', component: AdminMaintenanceComponent },
      { path: 'notifications', component: AdminNotificationsComponent },
    ],
  },
  {
    path: '**',
    redirectTo: 'client/dashboard',
  },
];
