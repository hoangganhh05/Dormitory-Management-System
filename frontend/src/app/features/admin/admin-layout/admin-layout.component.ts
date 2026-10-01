import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeftRight,
  lucideBell,
  lucideBuilding2,
  lucideClipboardCheck,
  lucideLayoutDashboard,
  lucideLogOut,
  lucideMenu,
  lucidePanelLeftClose,
  lucidePanelLeftOpen,
  lucideShieldCheck,
  lucideUsers,
  lucideWrench,
  lucideX,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIcon],
  providers: [
    provideIcons({
      lucideArrowLeftRight,
      lucideBell,
      lucideBuilding2,
      lucideClipboardCheck,
      lucideLayoutDashboard,
      lucideLogOut,
      lucideMenu,
      lucidePanelLeftClose,
      lucidePanelLeftOpen,
      lucideShieldCheck,
      lucideUsers,
      lucideWrench,
      lucideX,
    }),
  ],
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent {
  authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  isSidebarCollapsed = signal(false);
  isMobileSidebarOpen = signal(false);
  isLogoutConfirmOpen = signal(false);

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen.update(v => !v);
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  openLogoutConfirm(): void {
    this.isLogoutConfirmOpen.set(true);
  }

  closeLogoutConfirm(): void {
    this.isLogoutConfirmOpen.set(false);
  }

  confirmLogout(): void {
    this.isLogoutConfirmOpen.set(false);
    this.authService.logout('/login');
  }

  logout(): void {
    this.openLogoutConfirm();
  }
}
