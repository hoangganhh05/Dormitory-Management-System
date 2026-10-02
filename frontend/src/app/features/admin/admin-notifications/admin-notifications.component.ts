import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import {
  NotificationItem,
  NotificationStats,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationTargetRole,
  CreateNotificationDto,
  UpdateNotificationDto,
} from '../../../core/models/notification.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideBell, lucideCheck, lucideEye, lucideFileText, lucidePencil, lucidePin, lucidePlus, lucideSearch, lucideTrash2, lucideX } from '@ng-icons/lucide';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({ lucideAlertTriangle, lucideBell, lucideCheck, lucideEye, lucideFileText, lucidePencil, lucidePin, lucidePlus, lucideSearch, lucideTrash2, lucideX })],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.css',
})
export class AdminNotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  // Danh sách dữ liệu & Trạng thái tải
  notifications: NotificationItem[] = [];
  stats: NotificationStats | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  // Bộ lọc & Phân trang
  activeTab: 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'URGENT' = 'ALL';
  selectedCategory = '';
  selectedTargetRole = '';
  selectedBuilding = '';
  searchKeyword = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  totalItems = 0;

  // State Modal Soạn thảo / Chỉnh sửa
  isModalOpen = false;
  isEditing = false;
  currentNotifId: number | null = null;
  formTitle = '';
  formSummary = '';
  formContent = '';
  formCategory: NotificationCategory = 'GENERAL';
  formPriority: NotificationPriority = 'NORMAL';
  formTargetRole: NotificationTargetRole = 'ALL';
  formTargetBuilding = '';
  formIsPinned = false;
  formStatus: NotificationStatus = 'PUBLISHED';

  // State Modal Chi tiết (Xem trước)
  isPreviewOpen = false;
  previewItem: NotificationItem | null = null;

  // State Modal Xác nhận Xóa
  isDeleteConfirmOpen = false;
  deletingItem: NotificationItem | null = null;

  ngOnInit(): void {
    this.loadStats();
    this.loadNotifications();
  }

  loadStats(): void {
    this.notifService
      .getNotificationStats()
      .pipe(
        catchError((err) => {
          console.error('Lỗi khi tải thống kê thông báo:', err);
          return of({
            success: false,
            data: { total: 0, published: 0, draft: 0, archived: 0, pinned: 0, urgent: 0, categories: {} } as NotificationStats,
          });
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.stats = res.data;
          } else {
            this.stats = { total: 0, published: 0, draft: 0, archived: 0, pinned: 0, urgent: 0, categories: {} };
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Lỗi loadStats subscribe:', err);
          this.stats = { total: 0, published: 0, draft: 0, archived: 0, pinned: 0, urgent: 0, categories: {} };
          this.cdr.markForCheck();
        },
      });
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    let statusParam: NotificationStatus | '' = '';
    let priorityParam: NotificationPriority | '' = '';

    if (this.activeTab === 'PUBLISHED') statusParam = 'PUBLISHED';
    else if (this.activeTab === 'DRAFT') statusParam = 'DRAFT';
    else if (this.activeTab === 'ARCHIVED') statusParam = 'ARCHIVED';
    else if (this.activeTab === 'URGENT') priorityParam = 'URGENT';

    this.notifService
      .getNotifications({
        status: statusParam,
        priority: priorityParam || (this.selectedCategory === 'URGENT' ? 'URGENT' : ''),
        category: (this.selectedCategory as NotificationCategory) || '',
        targetRole: (this.selectedTargetRole as NotificationTargetRole) || '',
        targetBuilding: this.selectedBuilding,
        search: this.searchKeyword,
        page: this.page,
        limit: this.limit,
      })
      .pipe(
        catchError((err) => {
          console.error('Lỗi khi tải danh sách thông báo:', err);
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
          console.error('Lỗi khi tải thông báo subscribe:', err);
          this.notifications = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.errorMessage = 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // Chuyển Tab lọc nhanh
  switchTab(tab: 'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' | 'URGENT'): void {
    this.activeTab = tab;
    this.page = 1;
    this.loadNotifications();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadNotifications();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.page) {
      this.page = p;
      this.loadNotifications();
    }
  }

  // Mở modal tạo mới
  openCreateModal(): void {
    this.isEditing = false;
    this.currentNotifId = null;
    this.formTitle = '';
    this.formSummary = '';
    this.formContent = '';
    this.formCategory = 'GENERAL';
    this.formPriority = 'NORMAL';
    this.formTargetRole = 'ALL';
    this.formTargetBuilding = '';
    this.formIsPinned = false;
    this.formStatus = 'PUBLISHED';
    this.isModalOpen = true;
    this.errorMessage = '';
  }

  // Mở modal chỉnh sửa
  openEditModal(item: NotificationItem): void {
    this.isEditing = true;
    this.currentNotifId = item.id;
    this.formTitle = item.title;
    this.formSummary = item.summary || '';
    this.formContent = item.content;
    this.formCategory = item.category;
    this.formPriority = item.priority;
    this.formTargetRole = item.targetRole;
    this.formTargetBuilding = item.targetBuilding || '';
    this.formIsPinned = item.isPinned;
    this.formStatus = item.status;
    this.isModalOpen = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSaving = false;
  }

  // Lưu thông báo (Tạo mới hoặc Cập nhật)
  saveNotification(): void {
    if (!this.formTitle.trim()) {
      alert('Vui lòng nhập tiêu đề thông báo');
      return;
    }
    if (!this.formContent.trim()) {
      alert('Vui lòng nhập nội dung thông báo');
      return;
    }

    this.isSaving = true;
    const dto: CreateNotificationDto = {
      title: this.formTitle.trim(),
      summary: this.formSummary.trim() || undefined,
      content: this.formContent.trim(),
      category: this.formCategory,
      priority: this.formPriority,
      targetRole: this.formTargetRole,
      targetBuilding: this.formTargetBuilding || null,
      isPinned: this.formIsPinned,
      status: this.formStatus,
    };

    if (this.isEditing && this.currentNotifId) {
      this.notifService.updateNotification(this.currentNotifId, dto).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.showSuccess('Cập nhật thông báo thành công!');
            this.closeModal();
            this.loadNotifications();
            this.loadStats();
          }
        },
        error: (err) => {
          this.isSaving = false;
          alert(err?.message || 'Không thể cập nhật thông báo. Vui lòng thử lại sau.');
        },
      });
    } else {
      this.notifService.createNotification(dto).subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.showSuccess('Đăng tải thông báo thành công!');
            this.closeModal();
            this.loadNotifications();
            this.loadStats();
          }
        },
        error: (err) => {
          this.isSaving = false;
          alert(err?.message || 'Không thể đăng thông báo. Vui lòng thử lại sau.');
        },
      });
    }
  }

  // Bật/tắt ghim nhanh
  togglePin(item: NotificationItem, event: Event): void {
    event.stopPropagation();
    this.notifService.togglePin(item.id).subscribe({
      next: (res) => {
        if (res.success) {
          item.isPinned = !item.isPinned;
          this.showSuccess(
            item.isPinned ? 'Đã ghim thông báo lên đầu!' : 'Đã bỏ ghim thông báo!'
          );
          this.loadStats();
        }
      },
      error: (err) => alert(err?.message || 'Không thể thay đổi trạng thái ghim. Vui lòng thử lại sau.'),
    });
  }

  // Xem chi tiết (Preview modal)
  openPreview(item: NotificationItem): void {
    this.previewItem = item;
    this.isPreviewOpen = true;
    // Tự động tăng lượt xem
    this.notifService.getNotificationById(item.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.previewItem = res.data;
          item.viewCount = res.data.viewCount;
        }
      },
    });
  }

  closePreview(): void {
    this.isPreviewOpen = false;
    this.previewItem = null;
  }

  // Xác nhận xóa
  confirmDelete(item: NotificationItem, event: Event): void {
    event.stopPropagation();
    this.deletingItem = item;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen = false;
    this.deletingItem = null;
  }

  executeDelete(): void {
    if (!this.deletingItem) return;
    this.notifService.deleteNotification(this.deletingItem.id).subscribe({
      next: (res) => {
        this.closeDeleteConfirm();
        if (res.success) {
          this.showSuccess('Đã xóa thông báo vĩnh viễn!');
          this.loadNotifications();
          this.loadStats();
        }
      },
      error: (err) => {
        this.closeDeleteConfirm();
        alert(err?.message || 'Không thể xóa thông báo. Vui lòng thử lại sau.');
      },
    });
  }

  // Helpers hiển thị Badge
  getCategoryBadgeClass(category: NotificationCategory): string {
    switch (category) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'REGULATION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FINANCE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MAINTENANCE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'EVENT':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  getCategoryLabel(category: NotificationCategory): string {
    switch (category) {
      case 'URGENT':
        return 'Khẩn cấp';
      case 'REGULATION':
        return 'Nội quy';
      case 'FINANCE':
        return 'Tài chính / Phí';
      case 'MAINTENANCE':
        return 'Bảo trì';
      case 'EVENT':
        return 'Sự kiện';
      default:
        return 'Chung';
    }
  }

  getPriorityBadgeClass(priority: NotificationPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'text-red-700 bg-red-100/60 font-semibold';
      case 'IMPORTANT':
        return 'text-amber-700 bg-amber-100/60 font-medium';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  }

  getPriorityLabel(priority: NotificationPriority): string {
    switch (priority) {
      case 'URGENT':
        return 'Khẩn cấp';
      case 'IMPORTANT':
        return 'Quan trọng';
      default:
        return 'Thường';
    }
  }

  getTargetRoleLabel(role: NotificationTargetRole): string {
    switch (role) {
      case 'STUDENT':
        return 'Sinh viên';
      case 'ADMIN':
        return 'Nội bộ BQL';
      default:
        return 'Toàn KTX';
    }
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = '';
    }, 3500);
  }
}
