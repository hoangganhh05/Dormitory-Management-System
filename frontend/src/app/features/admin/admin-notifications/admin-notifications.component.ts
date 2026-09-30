import { Component, OnInit, inject } from '@angular/core';
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

@Component({
  selector: 'app-admin-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-notifications.component.html',
  styleUrl: './admin-notifications.component.css',
})
export class AdminNotificationsComponent implements OnInit {
  private notifService = inject(NotificationService);

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
    this.notifService.getNotificationStats().subscribe({
      next: (res) => {
        if (res.success) {
          this.stats = res.data;
        }
      },
      error: (err) => console.error('Lỗi khi tải thống kê thông báo:', err),
    });
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';

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
          this.errorMessage = err.error?.message || 'Không thể tải danh sách thông báo';
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
          alert(err.error?.message || 'Lỗi khi cập nhật thông báo');
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
          alert(err.error?.message || 'Lỗi khi đăng thông báo');
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
      error: (err) => alert(err.error?.message || 'Lỗi khi thay đổi ghim'),
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
        alert(err.error?.message || 'Lỗi khi xóa thông báo');
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
