import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { AuthService } from '../../../core/services/auth.service';
import { MaintenanceRequest } from '../../../core/models/maintenance.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideCheck, lucideClock3, lucideMessageCircle, lucideWrench, lucideSparkles } from '@ng-icons/lucide';
import {
  AiMaintenanceClassifierService,
  MaintenanceClassificationResult,
} from '../../../core/services/ai-maintenance-classifier.service';
import { catchError, finalize, of } from 'rxjs';

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
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({ lucideAlertTriangle, lucideCheck, lucideClock3, lucideMessageCircle, lucideWrench, lucideSparkles })],
  templateUrl: './client-maintenance.component.html',
  styleUrl: './client-maintenance.component.css'
})
export class ClientMaintenanceComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  authService = inject(AuthService);
  private aiClassifier = inject(AiMaintenanceClassifierService);

  aiSuggestion = signal<MaintenanceClassificationResult | null>(null);
  private debounceTimer: any = null;

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

    request$
      .pipe(
        catchError((err) => {
          console.error('[ClientMaintenanceComponent loadRequests Error]', err);
          return of({
            success: false,
            message: 'Không thể tải lịch sử báo hỏng. Vui lòng thử lại sau.',
            data: [] as MaintenanceRequest[],
          });
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          const list = res.success ? res.data || [] : [];
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
          if (!res.success) {
            this.loadError.set(res.message || 'Không thể tải lịch sử báo hỏng. Vui lòng thử lại sau.');
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('[ClientMaintenanceComponent loadRequests Error Handler]', err);
          this.myRequests.set([]);
          this.loadError.set('Không thể tải lịch sử báo hỏng. Vui lòng thử lại sau.');
          this.isLoading.set(false);
        },
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
        this.aiSuggestion.set(null);
        this.loadRequests();
        setTimeout(() => this.submitSuccess.set(false), 5000);
      },
      error: (err: any) => {
        console.error('[ClientMaintenanceComponent onSubmit Error]', err);
        this.isSubmitting.set(false);
        this.errorMessage.set('Không thể gửi yêu cầu báo hỏng lúc này. Vui lòng thử lại sau.');
      }
    });
  }
  onInputChange(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.runAiClassification();
    }, 400);
  }

  runAiClassification(): void {
    const trimmedTitle = this.title.trim();
    const trimmedDesc = this.description.trim();

    if (!trimmedTitle && !trimmedDesc) {
      this.aiSuggestion.set(null);
      return;
    }

    // 1. Phân loại tức thì từ local rule engine (phản hồi 0ms trên giao diện)
    const localResult = this.aiClassifier.classifyRequest(trimmedTitle, trimmedDesc);
    this.aiSuggestion.set(localResult);

    // Tự động gán mức độ khẩn cấp & phân loại danh mục vào form
    this.urgency = localResult.urgencyMapped;
    if (localResult.category) {
      this.category = localResult.category;
    }

    // 2. Gọi đồng bộ AI phân loại chuyên sâu từ Backend endpoint
    this.aiClassifier.classifyRequestRemote(trimmedTitle, trimmedDesc).subscribe({
      next: (remoteResult) => {
        if (remoteResult) {
          this.aiSuggestion.set(remoteResult);
          this.urgency = remoteResult.urgencyMapped;
          if (remoteResult.category) {
            this.category = remoteResult.category;
          }
        }
      },
      error: (err) => {
        console.warn('[ClientMaintenanceComponent] Phân tích AI từ xa thất bại, giữ kết quả nội bộ:', err);
      },
    });
  }

  getSeverityLabel(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return 'Khẩn cấp';
      case 'HIGH':
        return 'Mức độ Cao';
      case 'MEDIUM':
        return 'Trung bình';
      default:
        return 'Thấp';
    }
  }

  getSeverityTagClass(severity: string): string {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }
}
