import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  NotificationItem,
  NotificationCategory,
  NotificationPriority,
} from '../../../core/models/notification.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBell, lucideCheckCheck, lucideSearch, lucideX } from '@ng-icons/lucide';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-client-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({ lucideBell, lucideCheckCheck, lucideSearch, lucideX })],
  templateUrl: './client-notifications.component.html',
  styleUrl: './client-notifications.component.css',
})
export class ClientNotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  authService = inject(AuthService);

  notifications: NotificationItem[] = [];
  isLoading = false;
  searchKeyword = '';
  selectedCategory: string = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  totalItems = 0;
  errorMessage = '';

  // Modal xem chi tiết
  isDetailOpen = false;
  selectedNotification: NotificationItem | null = null;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.notifService
      .getNotifications({
        category: (this.selectedCategory as NotificationCategory) || '',
        search: this.searchKeyword,
        page: this.page,
        limit: this.limit,
      })
      .pipe(
        catchError((err) => {
          console.error('Lỗi khi tải thông báo:', err);
          return of({
            success: false,
            message: 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.',
            data: [] as NotificationItem[],
            pagination: { total: 0, page: this.page, limit: this.limit, totalPages: 1 },
          });
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.notifications = res.data;
            if (res.pagination) {
              this.totalItems = res.pagination.total;
              this.totalPages = res.pagination.totalPages;
              this.page = res.pagination.page;
            }
          } else {
            this.notifications = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.errorMessage = res.message || 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.';
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Lỗi khi tải thông báo:', err);
          this.notifications = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.errorMessage = 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadNotifications();
  }

  setCategory(cat: string): void {
    this.selectedCategory = cat;
    this.onFilterChange();
  }

  openDetail(item: NotificationItem): void {
    this.selectedNotification = item;
    this.isDetailOpen = true;

    // Tự động tăng lượt xem và đánh dấu đã đọc
    this.notifService.getNotificationById(item.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedNotification = res.data;
          item.isRead = true;
          item.viewCount = res.data.viewCount;
          this.cdr.markForCheck();
        }
      },
    });
  }

  closeDetail(): void {
    this.isDetailOpen = false;
    this.selectedNotification = null;
    this.cdr.markForCheck();
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.forEach((n) => (n.isRead = true));
          this.cdr.markForCheck();
        }
      },
      error: (err) => console.error('Lỗi khi đánh dấu đọc:', err),
    });
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.page) {
      this.page = p;
      this.loadNotifications();
    }
  }

  // Helpers
  getCategoryBadgeClass(category: NotificationCategory): string {
    switch (category) {
      case 'URGENT':
        return 'badge-urgent';
      case 'REGULATION':
        return 'badge-regulation';
      case 'FINANCE':
        return 'badge-finance';
      case 'MAINTENANCE':
        return 'badge-maintenance';
      case 'EVENT':
        return 'badge-event';
      default:
        return 'badge-general';
    }
  }

  getCategoryLabel(category: NotificationCategory): string {
    switch (category) {
      case 'URGENT':
        return 'Khẩn cấp';
      case 'REGULATION':
        return 'Nội quy KTX';
      case 'FINANCE':
        return 'Tài chính / Phí';
      case 'MAINTENANCE':
        return 'Bảo trì thiết bị';
      case 'EVENT':
        return 'Sự kiện / Phong trào';
      default:
        return 'Thông báo chung';
    }
  }

  getPriorityLabel(priority: NotificationPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'Khẩn cấp';
      case 'IMPORTANT':
        return 'Quan trọng';
      default:
        return 'Bình thường';
    }
  }
}
