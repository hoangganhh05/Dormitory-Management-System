import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { Registration } from '../../../core/models/registration.model';

@Component({
  selector: 'app-client-registration-result',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-registration-result.component.html',
  styleUrl: './client-registration-result.component.css',
})
export class ClientRegistrationResultComponent implements OnInit {
  private readonly registrationService = inject(RegistrationService);
  private readonly authService = inject(AuthService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly registrations = signal<Registration[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    if (this.isLoggedIn()) {
      this.loadRegistrations();
    }
  }

  loadRegistrations(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.registrationService.getMyRegistrations().subscribe({
      next: (registrations) => {
        this.registrations.set(registrations);
        this.isLoading.set(false);
      },
      error: (error: Error) => {
        console.error('[ClientRegistrationResult] Không thể tải kết quả đăng ký:', error);
        this.errorMessage.set('Không thể tải kết quả đăng ký. Vui lòng thử lại sau.');
        this.isLoading.set(false);
      },
    });
  }

  cancelRegistration(id: number): void {
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn đăng ký #REG-${id}?`)) {
      return;
    }

    this.registrationService.cancelMyRegistration(id).subscribe({
      next: () => this.loadRegistrations(),
      error: () => alert('Không thể hủy đơn đăng ký lúc này. Vui lòng thử lại sau.'),
    });
  }

  statusLabel(status: Registration['status']): string {
    return {
      PENDING: 'Chờ duyệt',
      APPROVED: 'Đã duyệt',
      REJECTED: 'Từ chối',
      CANCELLED: 'Đã hủy',
    }[status];
  }

  formatSemester(semester: string | null | undefined): string {
    if (!semester || semester === 'H?c k? 1') {
      return 'Học kỳ 1';
    }

    return semester.replace(/\s*\((\d{4}\s*-\s*\d{4})\)\s*\(\d{4}\s*-\s*\d{4}\)\s*$/, ' ($1)');
  }
}
