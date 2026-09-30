import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { AuthService } from '../../../core/services/auth.service';
import { MaintenanceRequest } from '../../../core/models/maintenance.model';

export interface MaintenanceItem {
  id: number;
  roomNumber: string;
  title: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  createdAt: string;
  feedback?: string;
}

@Component({
  selector: 'app-client-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-maintenance.component.html',
  styleUrl: './client-maintenance.component.css'
})
export class ClientMaintenanceComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  authService = inject(AuthService);

  // Form fields
  roomNumber = 'B101';
  title = '';
  category = 'Điện & Quạt';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  description = '';

  isLoading = signal(true);
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  errorMessage = signal('');
  loadError = signal('');

  // Maintenance history from API
  myRequests = signal<MaintenanceItem[]>([]);

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user && user.studentCode) {
      // Tự động gán phòng nếu sinh viên đang ở
      if (user.studentCode === 'DTC235200050') {
        this.roomNumber = 'B101';
      }
    }
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    const request$ = this.authService.currentUser()
      ? this.maintenanceService.getMyRequests()
      : this.maintenanceService.getRequests();

    request$.subscribe({
      next: (res) => {
        const list = res.data || [];
        const mapped: MaintenanceItem[] = list.map((r) => ({
          id: r.id,
          roomNumber: r.room?.roomNumber || 'KTX',
          title: r.title,
          category: this.inferCategory(r.title),
          urgency: r.urgency,
          status: r.status,
          createdAt: new Date(r.createdAt).toLocaleDateString('vi-VN'),
          feedback: r.adminFeedback || undefined,
        }));
        this.myRequests.set(mapped);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('[ClientMaintenanceComponent loadRequests Error]', err);
        this.loadError.set('Không thể tải lịch sử báo hỏng từ máy chủ API.');
        this.isLoading.set(false);
      }
    });
  }

  private inferCategory(title: string): string {
    const lower = title.toLowerCase();
    if (lower.includes('nước') || lower.includes('vòi') || lower.includes('tắc')) return 'Cấp thoát nước';
    if (lower.includes('cửa') || lower.includes('khóa') || lower.includes('bản lề')) return 'Khóa & Cửa sổ';
    if (lower.includes('điều hòa') || lower.includes('lạnh')) return 'Điều hòa nhiệt độ';
    return 'Điện & Thiết bị';
  }

  onSubmit(): void {
    if (!this.title.trim() || !this.description.trim()) {
      this.errorMessage.set('Vui lòng nhập đầy đủ tiêu đề và mô tả sự cố hỏng hóc!');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.submitSuccess.set(false);

    const user = this.authService.currentUser();
    const payload = {
      roomNumber: this.roomNumber.trim(),
      title: `[${this.category}] ${this.title.trim()}`,
      description: this.description.trim(),
      urgency: this.urgency,
      studentCode: user?.studentCode || 'DTC235200050',
    };

    this.maintenanceService.createRequest(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitSuccess.set(true);
        this.title = '';
        this.description = '';
        this.loadRequests();
        setTimeout(() => this.submitSuccess.set(false), 5000);
      },
      error: (err: any) => {
        console.error('[ClientMaintenanceComponent onSubmit Error]', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || err.message || 'Lỗi khi gửi yêu cầu báo hỏng tới máy chủ API.');
      }
    });
  }
}
