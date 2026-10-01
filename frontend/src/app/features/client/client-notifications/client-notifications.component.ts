import { Component, OnInit, inject } from '@angular/core';
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
  authService = inject(AuthService);

  notifications: NotificationItem[] = [];
  isLoading = false;
  searchKeyword = '';
  selectedCategory: string = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  totalItems = 0;

  // Modal xem chi tiết
  isDetailOpen = false;
  selectedNotification: NotificationItem | null = null;

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notifService
      .getNotifications({
        category: (this.selectedCategory as NotificationCategory) || '',
        search: this.searchKeyword,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.notifications = res.data;
            if (res.pagination) {
              this.totalItems = res.pagination.total;
              this.totalPages = res.pagination.totalPages;
              this.page = res.pagination.page;
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Lỗi khi tải thông báo:', err);
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
        }
      },
    });
  }

  closeDetail(): void {
    this.isDetailOpen = false;
    this.selectedNotification = null;
  }

  markAllAsRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: (res) => {
        if (res.success) {
          this.notifications.forEach((n) => (n.isRead = true));
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
