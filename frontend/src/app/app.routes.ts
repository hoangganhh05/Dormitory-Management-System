import { Routes } from '@angular/router';
import { ClientLayoutComponent } from './features/client/client-layout/client-layout.component';
import { ClientHomeComponent } from './features/client/client-home/client-home.component';
import { ClientRoomsComponent } from './features/client/client-rooms/client-rooms.component';
import { ClientRegisterRoomComponent } from './features/client/client-register-room/client-register-room.component';
import { ClientMaintenanceComponent } from './features/client/client-maintenance/client-maintenance.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'client/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'client',
    component: ClientLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: ClientHomeComponent,
      },
      {
        path: 'rooms',
        component: ClientRoomsComponent,
      },
      {
        path: 'register-room',
        component: ClientRegisterRoomComponent,
      },
      {
        path: 'maintenance',
        component: ClientMaintenanceComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'client/dashboard',
  },
];
