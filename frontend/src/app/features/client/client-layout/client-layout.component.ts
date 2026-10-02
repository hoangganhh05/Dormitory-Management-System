import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService, DormitorySettings } from '../../../core/services/settings.service';
import { DormAiChatbotComponent } from '../../../shared/components/dorm-ai-chatbot/dorm-ai-chatbot.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBuilding2,
  lucideLayoutDashboard,
  lucideSearch,
  lucideFileText,
  lucideWrench,
  lucideBell,
  lucideUser,
  lucideLogOut,
  lucideLogIn,
  lucideMenu,
  lucideX,
  lucidePanelLeftClose,
  lucidePanelLeftOpen,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIcon, DormAiChatbotComponent],
  providers: [
    provideIcons({
      lucideBuilding2,
      lucideLayoutDashboard,
      lucideSearch,
      lucideFileText,
      lucideWrench,
      lucideBell,
      lucideUser,
      lucideLogOut,
      lucideLogIn,
      lucideMenu,
      lucideX,
      lucidePanelLeftClose,
      lucidePanelLeftOpen,
    }),
  ],
  templateUrl: './client-layout.component.html'
})
export class ClientLayoutComponent implements OnInit {
  authService = inject(AuthService);
  private settingsService = inject(SettingsService);

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;
  isAdmin = this.authService.isAdmin;

  isMobileMenuOpen = signal(false);
  isSidebarCollapsed = signal(false);
  isLogoutConfirmOpen = signal(false);
  hotline = '';
  closingHour = '';

  ngOnInit(): void {
    this.settingsService.getPublicSettings().subscribe((response) => {
      const settings: DormitorySettings = response.success ? response.data : {};
      this.hotline = settings['HOTLINE'] || '';
      this.closingHour = settings['CLOSING_HOUR'] || '';
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(v => !v);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
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
