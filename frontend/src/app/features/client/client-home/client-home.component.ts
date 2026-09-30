import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationItem, NotificationCategory } from '../../../core/models/notification.model';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-home.component.html',
  styleUrl: './client-home.component.css'
})
export class ClientHomeComponent implements OnInit {
  private notifService = inject(NotificationService);
  authService = inject(AuthService);

  studentName = 'Phạm Thị Ngọc Ánh';
  studentCode = 'DTC235200050';
  currentRoom = 'Phòng A101';
  currentBed = 'Giường G2 (Tầng 1 - Tòa A)';
  stayStatus = 'Đang lưu trú';

  quickActions = [
    {
      title: 'Tra cứu phòng trống',
      desc: 'Tìm kiếm phòng theo tòa nhà, tầng, loại phòng tiêu chuẩn/VIP.',
      icon: '🏢',
      link: '/client/rooms',
      badge: 'Còn phòng'
    },
    {
      title: 'Đăng ký lưu trú',
      desc: 'Nộp đơn xin ở Ký túc xá cho học kỳ mới trực tuyến nhanh chóng.',
      icon: '📝',
      link: '/client/register-room',
      badge: 'Đang mở'
    },
    {
      title: 'Bảng tin thông báo',
      desc: 'Tra cứu nội quy KTX, thông báo lệ phí và lịch bảo trì.',
      icon: '📢',
      link: '/client/notifications',
      badge: 'Chính thức'
    },
    {
      title: 'Báo hỏng cơ sở vật chất',
      desc: 'Gửi yêu cầu sửa chữa bóng đèn, quạt, đường nước, giường tủ.',
      icon: '🛠️',
      link: '/client/maintenance',
      badge: 'Hỗ trợ 24/7'
    }
  ];

  announcements: NotificationItem[] = [];
  isLoadingAnnouncements = false;

  // Modal chi tiết thông báo
  isDetailOpen = false;
  selectedNotification: NotificationItem | null = null;

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.studentName = user.fullName;
      this.studentCode = user.studentCode || 'DTC235200050';
    }
    this.loadAnnouncements();
  }

  loadAnnouncements(): void {
    this.isLoadingAnnouncements = true;
    this.notifService.getNotifications({ limit: 4 }).subscribe({
      next: (res) => {
        this.isLoadingAnnouncements = false;
        if (res.success) {
          this.announcements = res.data;
        }
      },
      error: (err) => {
        this.isLoadingAnnouncements = false;
        console.error('Lỗi khi tải thông báo trang chủ:', err);
      },
    });
  }

  openDetail(item: NotificationItem): void {
    this.selectedNotification = item;
    this.isDetailOpen = true;

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

  getCategoryBadgeClass(category: NotificationCategory): string {
    switch (category) {
      case 'URGENT': return 'badge-urgent';
      case 'REGULATION': return 'badge-regulation';
      case 'FINANCE': return 'badge-finance';
      case 'MAINTENANCE': return 'badge-maintenance';
      case 'EVENT': return 'badge-event';
      default: return 'badge-general';
    }
  }

  getCategoryLabel(category: NotificationCategory): string {
    switch (category) {
      case 'URGENT': return 'Khẩn cấp';
      case 'REGULATION': return 'Nội quy';
      case 'FINANCE': return 'Tài chính';
      case 'MAINTENANCE': return 'Bảo trì';
      case 'EVENT': return 'Sự kiện';
      default: return 'Chung';
    }
  }
}
