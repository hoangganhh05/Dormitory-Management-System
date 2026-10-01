import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import {
  MaintenanceRequest,
  MaintenanceStats,
  MaintenanceStatus,
  MaintenanceUrgency,
} from '../../../core/models/maintenance.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideCheck, lucideCheckCircle, lucideClipboardList, lucideClock3, lucidePencil, lucideSearch, lucideTrash2, lucideX, lucideSparkles } from '@ng-icons/lucide';
import { catchError, finalize, of } from 'rxjs';
import {
  AiMaintenanceClassifierService,
  MaintenanceClassificationResult,
} from '../../../core/services/ai-maintenance-classifier.service';

@Component({
  selector: 'app-admin-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({ lucideAlertTriangle, lucideCheck, lucideCheckCircle, lucideClipboardList, lucideClock3, lucidePencil, lucideSearch, lucideTrash2, lucideX, lucideSparkles })],
  templateUrl: './admin-maintenance.component.html',
  styleUrl: './admin-maintenance.component.css',
})
export class AdminMaintenanceComponent implements OnInit {
  private maintenanceService = inject(MaintenanceService);
  private aiClassifier = inject(AiMaintenanceClassifierService);

  requests: MaintenanceRequest[] = [];
  stats: MaintenanceStats | null = null;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  // Bộ lọc
  activeTab: 'ALL' | 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED' | 'HIGH' = 'ALL';
  selectedUrgency = '';
  selectedBuilding = '';
  searchKeyword = '';
  page = 1;
  limit = 10;
  totalPages = 1;
  totalItems = 0;

  // Modal xử lý trạng thái
  isModalOpen = false;
  selectedRequest: MaintenanceRequest | null = null;
  formStatus: MaintenanceStatus = 'PROCESSING';
  formFeedback = '';

  // Modal xác nhận xóa
  isDeleteConfirmOpen = false;
  deletingRequest: MaintenanceRequest | null = null;

  ngOnInit(): void {
    this.loadStats();
    this.loadRequests();
  }

  loadStats(): void {
    this.maintenanceService
      .getMaintenanceStats()
      .pipe(
        catchError((err) => {
          console.error('Lỗi khi tải thống kê bảo trì:', err);
          return of({
            success: false,
            data: { total: 0, pending: 0, processing: 0, resolved: 0, rejected: 0, highUrgency: 0 } as MaintenanceStats,
          });
        }),
      )
      .subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.stats = res.data;
          } else {
            this.stats = { total: 0, pending: 0, processing: 0, resolved: 0, rejected: 0, highUrgency: 0 };
          }
        },
        error: (err) => {
          console.error('Lỗi loadStats subscribe:', err);
          this.stats = { total: 0, pending: 0, processing: 0, resolved: 0, rejected: 0, highUrgency: 0 };
        },
      });
  }

  loadRequests(): void {
    this.isLoading = true;
    this.errorMessage = '';

    let statusParam = '';
    let urgencyParam = this.selectedUrgency;

    if (this.activeTab === 'PENDING') statusParam = 'PENDING';
    else if (this.activeTab === 'PROCESSING') statusParam = 'PROCESSING';
    else if (this.activeTab === 'RESOLVED') statusParam = 'RESOLVED';
    else if (this.activeTab === 'REJECTED') statusParam = 'REJECTED';
    else if (this.activeTab === 'HIGH') urgencyParam = 'HIGH';

    this.maintenanceService
      .getRequests({
        status: statusParam,
        urgency: urgencyParam,
        building: this.selectedBuilding,
        search: this.searchKeyword,
        page: this.page,
        limit: this.limit,
      })
      .pipe(
        catchError((err) => {
          console.error('Lỗi khi tải danh sách yêu cầu bảo trì:', err);
          return of({
            success: false,
            message: 'Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.',
            data: [] as MaintenanceRequest[],
            pagination: { total: 0, page: this.page, limit: this.limit, totalPages: 1 },
          });
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.requests = this.sortRequestsByAiPriority(res.data || []);
            if (res.pagination) {
              this.totalItems = res.pagination.total;
              this.totalPages = res.pagination.totalPages;
              this.page = res.pagination.page;
            }
          } else {
            this.requests = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.errorMessage = res.message || 'Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Lỗi loadRequests subscribe:', err);
          this.requests = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.errorMessage = 'Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.';
          this.isLoading = false;
        },
      });
  }

  switchTab(tab: 'ALL' | 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED' | 'HIGH'): void {
    this.activeTab = tab;
    this.page = 1;
    this.loadRequests();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadRequests();
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages && p !== this.page) {
      this.page = p;
      this.loadRequests();
    }
  }

  // Mở modal xử lý sự cố
  openProcessModal(item: MaintenanceRequest): void {
    this.selectedRequest = item;
    this.formStatus = item.status === 'PENDING' ? 'PROCESSING' : item.status;
    this.formFeedback = item.adminFeedback || '';
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedRequest = null;
    this.isSaving = false;
  }

  saveProcess(): void {
    if (!this.selectedRequest) return;
    this.isSaving = true;

    this.maintenanceService
      .updateStatus(this.selectedRequest.id, this.formStatus, this.formFeedback)
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success) {
            this.showSuccess(res.message || 'Cập nhật tiến độ thành công!');
            this.closeModal();
            this.loadRequests();
            this.loadStats();
          }
        },
        error: (err) => {
          this.isSaving = false;
          alert('Không thể cập nhật trạng thái. Vui lòng thử lại sau.');
        },
      });
  }

  // Xác nhận xóa
  confirmDelete(item: MaintenanceRequest): void {
    this.deletingRequest = item;
    this.isDeleteConfirmOpen = true;
  }

  closeDeleteConfirm(): void {
    this.isDeleteConfirmOpen = false;
    this.deletingRequest = null;
  }

  executeDelete(): void {
    if (!this.deletingRequest) return;
    this.maintenanceService.deleteRequest(this.deletingRequest.id).subscribe({
      next: (res) => {
        this.closeDeleteConfirm();
        if (res.success) {
          this.showSuccess('Đã xóa yêu cầu bảo trì thành công!');
          this.loadRequests();
          this.loadStats();
        }
      },
      error: (err) => {
        this.closeDeleteConfirm();
        alert('Không thể xóa yêu cầu lúc này. Vui lòng thử lại sau.');
      },
    });
  }

  // Helpers hiển thị Badge
  getUrgencyBadgeClass(reqOrUrgency: MaintenanceRequest | MaintenanceUrgency): string {
    const urgency = typeof reqOrUrgency === 'string' ? reqOrUrgency : this.getUrgencyDisplayLevel(reqOrUrgency);
    switch (urgency) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  }

  getUrgencyLabel(urgency: MaintenanceUrgency): string {
    switch (urgency) {
      case 'HIGH':
        return 'Khẩn cấp';
      case 'MEDIUM':
        return 'Thường';
      default:
        return 'Thấp';
    }
  }

  getAiAnalysis(req: MaintenanceRequest): MaintenanceClassificationResult {
    return this.aiClassifier.classifyRequest(req.title, req.description);
  }

  getUrgencyDisplayLevel(req: MaintenanceRequest): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const ai = this.getAiAnalysis(req);
    if (ai.severity === 'CRITICAL') return 'CRITICAL';
    if (req.urgency === 'HIGH' || ai.severity === 'HIGH') return 'HIGH';
    if (req.urgency === 'LOW' && ai.severity === 'LOW') return 'LOW';
    return 'MEDIUM';
  }

  getAiReason(req: MaintenanceRequest): string {
    return this.getAiAnalysis(req).aiReason;
  }

  sortRequestsByAiPriority(list: MaintenanceRequest[]): MaintenanceRequest[] {
    return [...list].sort((a, b) => {
      const aPending = a.status === 'PENDING' || a.status === 'PROCESSING';
      const bPending = b.status === 'PENDING' || b.status === 'PROCESSING';

      // 1. Ưu tiên các phiếu đang chờ tiếp nhận / xử lý
      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      // 2. Phân loại theo mức độ nghiêm trọng AI
      const aAi = this.getAiAnalysis(a);
      const bAi = this.getAiAnalysis(b);

      const score = (item: MaintenanceRequest, ai: MaintenanceClassificationResult) => {
        if (ai.severity === 'CRITICAL') return 4;
        if (item.urgency === 'HIGH' || ai.severity === 'HIGH') return 3;
        if (item.urgency === 'MEDIUM' || ai.severity === 'MEDIUM') return 2;
        return 1;
      };

      const diff = score(b, bAi) - score(a, aAi);
      if (diff !== 0) return diff;

      // 3. Thời gian tạo mới hơn lên trước
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });



  }

  getStatusBadgeClass(status: MaintenanceStatus): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'PROCESSING':
        return 'status-processing';
      case 'RESOLVED':
        return 'status-resolved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  getStatusLabel(status: MaintenanceStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Chờ tiếp nhận';
      case 'PROCESSING':
        return 'Đang xử lý';
      case 'RESOLVED':
        return 'Hoàn thành';
      case 'REJECTED':
        return 'Từ chối';
      default:
        return status;
    }
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = '';
    }, 3500);
  }
}
