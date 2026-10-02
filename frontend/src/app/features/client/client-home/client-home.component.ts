import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { StudentService } from '../../../core/services/student.service';
import { SettingsService, DormitorySettings } from '../../../core/services/settings.service';
import { NotificationItem, NotificationCategory } from '../../../core/models/notification.model';
import { MaintenanceRequest, MaintenanceStatus, MaintenanceUrgency } from '../../../core/models/maintenance.model';
import { StudentProfile } from '../../../core/models/student.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideDoorClosed,
  lucideBed,
  lucideWrench,
  lucideBot,
  lucideSparkles,
  lucidePin,
  lucideClock,
  lucideCalendarCheck,
  lucideSearch,
  lucideChevronRight,
  lucideArrowRight,
  lucidePhoneCall,
  lucideX,
  lucideAlertCircle,
} from '@ng-icons/lucide';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  providers: [
    provideIcons({
      lucideDoorClosed,
      lucideBed,
      lucideWrench,
      lucideBot,
      lucideSparkles,
      lucidePin,
      lucideClock,
      lucideCalendarCheck,
      lucideSearch,
      lucideChevronRight,
      lucideArrowRight,
      lucidePhoneCall,
      lucideX,
      lucideAlertCircle,
    }),
  ],
  templateUrl: './client-home.component.html',
  styleUrl: './client-home.component.css'
})
export class ClientHomeComponent implements OnInit {
  private notifService = inject(NotificationService);
  private maintenanceService = inject(MaintenanceService);
  private studentService = inject(StudentService);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);
  authService = inject(AuthService);

  studentName = '';
  studentCode = '';
  currentRoom = '';
  currentBed = '';
  stayStatus = '';

  hotline = '';
  closingHour = '';
  dutyRoom = '';

  quickActions = [
    {
      title: 'Báo hỏng thiết bị',
      desc: 'Gửi yêu cầu sửa chữa điện, quạt, đường nước, giường tủ.',
      link: '/client/maintenance',
      icon: 'lucideWrench',
      badge: 'Hỗ trợ 24/7'
    },
    {
      title: 'Gia hạn lưu trú',
      desc: 'Nộp đơn gia hạn ở Ký túc xá cho học kỳ mới trực tuyến.',
      link: '/client/register-room',
      icon: 'lucideCalendarCheck',
      badge: 'Đang mở'
    },
    {
      title: 'Đăng ký tạm vắng',
      desc: 'Khai báo tạm vắng qua đêm hoặc kỳ nghỉ cuối tuần thuận tiện.',
      link: '/client/register-room',
      icon: 'lucideClock',
      badge: 'Trực tuyến'
    },
    {
      title: 'Tra cứu phòng trống',
      desc: 'Tìm kiếm phòng theo tòa nhà, tầng, loại phòng tiêu chuẩn/VIP.',
      link: '/client/rooms',
      icon: 'lucideSearch',
      badge: 'Còn phòng'
    }
  ];

  announcements: NotificationItem[] = [];
  isLoadingAnnouncements = false;

  // Maintenance Requests Data
  recentRequests: MaintenanceRequest[] = [];
  isLoadingRequests = false;
  pendingRequestsCount = 0;

  // Modal chi tiết thông báo
  isDetailOpen = false;
  selectedNotification: NotificationItem | null = null;

  ngOnInit(): void {
    this.loadStudentProfile();
    this.loadSettings();
    this.loadAnnouncements();
    this.loadRecentRequests();
  }

  private loadStudentProfile(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.applyStudentProfile(null);
      return;
    }

    this.studentService
      .getMyProfile()
      .pipe(
        catchError((err) => {
          console.error('Lỗi khi tải thông tin lưu trú trang chủ:', err);
          return of(null as StudentProfile | null);
        }),
      )
      .subscribe((profile) => this.applyStudentProfile(profile));
  }

  private applyStudentProfile(profile: StudentProfile | null): void {
    const authUser = this.authService.currentUser();
    const occupiedBed = profile?.occupiedBed;
    const room = occupiedBed?.room;

    this.studentName = profile?.fullName || authUser?.fullName || '';
    this.studentCode = profile?.studentCode || authUser?.studentCode || '';

    if (room && occupiedBed) {
      this.currentRoom = `Phòng ${room.roomNumber}`;
      this.currentBed = `Giường ${occupiedBed.bedNumber} (Tầng ${room.floor} - ${room.building})`;
      this.stayStatus = 'Đang lưu trú';
    } else {
      this.currentRoom = '';
      this.currentBed = '';
      this.stayStatus = '';
    }
    this.cdr.markForCheck();
  }

  private loadSettings(): void {
    this.settingsService.getPublicSettings().subscribe((response) => {
      const settings: DormitorySettings = response.success ? response.data : {};
      this.hotline = settings['HOTLINE'] || '';
      this.closingHour = settings['CLOSING_HOUR'] || '';
      this.dutyRoom = settings['DUTY_ROOM'] || '';
      this.cdr.markForCheck();
    });
  }

  loadAnnouncements(): void {
    this.isLoadingAnnouncements = true;
    this.cdr.markForCheck();
    this.notifService
      .getNotifications({ limit: 4 })
      .pipe(
        catchError((err) => {
          console.error('Lỗi khi tải thông báo trang chủ:', err);
          return of({ success: false, data: [] as NotificationItem[] });
        }),
        finalize(() => {
          this.isLoadingAnnouncements = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.announcements = res.data;
          } else {
            this.announcements = [];
          }
          this.isLoadingAnnouncements = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Lỗi loadAnnouncements subscribe:', err);
          this.announcements = [];
          this.isLoadingAnnouncements = false;
          this.cdr.markForCheck();
        },
      });
  }

  loadRecentRequests(): void {
    if (!this.authService.currentUser()) {
      this.recentRequests = [];
      this.pendingRequestsCount = 0;
      this.isLoadingRequests = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoadingRequests = true;
    this.cdr.markForCheck();
    this.maintenanceService.getMyRequests()
      .pipe(
        catchError((err) => {
          console.error('Lỗi khi tải yêu cầu cơ sở vật chất trang chủ:', err);
          return of({ success: false, data: [] as MaintenanceRequest[] });
        }),
        finalize(() => {
          this.isLoadingRequests = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (res) => {
          const list = res.success ? res.data || [] : [];
          this.recentRequests = list.slice(0, 4);
          this.pendingRequestsCount = list.filter(r => r.status === 'PENDING' || r.status === 'PROCESSING').length;
          this.isLoadingRequests = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Lỗi loadRecentRequests subscribe:', err);
          this.recentRequests = [];
          this.pendingRequestsCount = 0;
          this.isLoadingRequests = false;
          this.cdr.markForCheck();
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
      case 'URGENT': return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'REGULATION': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'FINANCE': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'MAINTENANCE': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'EVENT': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
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

  getUrgencyBadgeClass(urgency: string): string {
    switch (urgency) {
      case 'HIGH': return 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200';
      case 'MEDIUM': return 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200';
      default: return 'inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200';
    }
  }

  getUrgencyLabel(urgency: string): string {
    switch (urgency) {
      case 'HIGH': return 'Khẩn';
      case 'MEDIUM': return 'Thường';
      default: return 'Thấp';
    }
  }

  getMaintenanceStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200';
      case 'PROCESSING': return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200';
      case 'RESOLVED': return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'REJECTED': return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200';
      default: return 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  getMaintenanceStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'PROCESSING': return 'Đang xử lý';
      case 'RESOLVED': return 'Hoàn thành';
      case 'REJECTED': return 'Từ chối';
      default: return status;
    }
  }
}
