import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../core/services/maintenance.service';
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
    this.loadRequests();
  }

  loadRequests(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.maintenanceService.getRequests().subscribe({
      next: (requests: MaintenanceRequest[]) => {
        const mapped: MaintenanceItem[] = requests.map((r) => ({
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
      error: (err: Error) => {
        console.error('[ClientMaintenanceComponent loadRequests Error]', err);
        this.loadError.set('Không thể tải lịch sử báo hỏng từ máy chủ API. Vui lòng kiểm tra kết nối mạng.');
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

    const payload = {
      roomNumber: this.roomNumber,
      title: `[${this.category}] ${this.title.trim()}`,
      description: this.description.trim(),
      urgency: this.urgency,
      studentCode: 'DTC235200050',
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
      error: (err: Error) => {
        console.error('[ClientMaintenanceComponent onSubmit Error]', err);
        this.isSubmitting.set(false);
        this.errorMessage.set(err.message || 'Lỗi khi gửi yêu cầu báo hỏng tới máy chủ API.');
      }
    });
  }
}
