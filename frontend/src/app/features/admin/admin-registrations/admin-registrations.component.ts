import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegistrationService } from '../../../core/services/registration.service';
import { Registration, RegistrationStatsSummary } from '../../../core/models/registration.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideBedDouble,
  lucideCheck,
  lucideCheckCircle,
  lucideCircleAlert,
  lucideFileText,
  lucideInfo,
  lucideRefreshCw,
  lucideSearch,
  lucideX,
  lucideXCircle,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-admin-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideAlertTriangle,
      lucideBedDouble,
      lucideCheck,
      lucideCheckCircle,
      lucideCircleAlert,
      lucideFileText,
      lucideInfo,
      lucideRefreshCw,
      lucideSearch,
      lucideX,
      lucideXCircle,
    }),
  ],
  templateUrl: './admin-registrations.component.html',
  styleUrl: './admin-registrations.component.css'
})
export class AdminRegistrationsComponent implements OnInit {
  private registrationService = inject(RegistrationService);
  private fb = inject(FormBuilder);

  registrations = signal<Registration[]>([]);
  stats = signal<RegistrationStatsSummary | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  actionSuccessMsg = signal('');

  // Filters
  currentTab = signal<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'>('PENDING');
  searchTerm = signal('');
  selectedSemester = signal('ALL');

  // Modals state
  selectedReg = signal<Registration | null>(null);
  isApproveModalOpen = signal(false);
  isRejectModalOpen = signal(false);
  isDetailModalOpen = signal(false);
  isSubmitting = signal(false);

  // Approve form
  selectedBedId = signal<number | null>(null);

  // Reject form
  rejectForm: FormGroup;

  // Computed filtered list
  filteredList = computed(() => {
    const tab = this.currentTab();
    const search = this.searchTerm().toLowerCase().trim();
    const semester = this.selectedSemester();

    return this.registrations().filter((r) => {
      const matchTab = tab === 'ALL' || r.status === tab;

      const matchSemester = semester === 'ALL' || r.semester.includes(semester);

      const matchSearch =
        !search ||
        (r.user?.fullName && r.user.fullName.toLowerCase().includes(search)) ||
        (r.user?.studentCode && r.user.studentCode.toLowerCase().includes(search)) ||
        (r.user?.email && r.user.email.toLowerCase().includes(search)) ||
        (r.preferredRoom?.roomNumber && r.preferredRoom.roomNumber.toLowerCase().includes(search)) ||
        String(r.id).includes(search);

      return matchTab && matchSemester && matchSearch;
    });
  });

  // Vacant beds in the preferred room for approval modal
  vacantBeds = computed(() => {
    const reg = this.selectedReg();
    if (!reg || !reg.preferredRoom || !reg.preferredRoom.beds) return [];
    return reg.preferredRoom.beds.filter((b) => b.status === 'VACANT');
  });

  // Unique semesters for dropdown
  semesterList = computed(() => {
    const set = new Set<string>();
    this.registrations().forEach((r) => {
      if (r.semester) set.add(r.semester);
    });
    return Array.from(set);
  });

  constructor() {
    this.rejectForm = this.fb.group({
      rejectionReason: ['', [Validators.required, Validators.minLength(5)]],
      presetReason: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.registrationService.getRegistrations().subscribe({
      next: (list) => {
        this.registrations.set(list);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('[AdminRegistrationsComponent Error]', err);
        this.errorMessage.set('Không thể tải danh sách đơn đăng ký. Vui lòng thử lại sau.');
        this.isLoading.set(false);
      },
    });

    this.loadStats();
  }

  loadStats(): void {
    this.registrationService.getRegistrationStats().subscribe({
      next: (st) => this.stats.set(st),
      error: (err) => console.error('[RegistrationStats Error]', err),
    });
  }

  // VIEW DETAIL
  openDetailModal(reg: Registration): void {
    this.selectedReg.set(reg);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedReg.set(null);
  }

  // APPROVE WORKFLOW
  openApproveModal(reg: Registration): void {
    this.selectedReg.set(reg);
    // Pre-select first vacant bed if available
    const beds = (reg.preferredRoom?.beds || []).filter((b) => b.status === 'VACANT');
    if (beds.length > 0) {
      this.selectedBedId.set(beds[0].id);
    } else {
      this.selectedBedId.set(null);
    }
    this.isApproveModalOpen.set(true);
  }

  closeApproveModal(): void {
    this.isApproveModalOpen.set(false);
    this.selectedReg.set(null);
  }

  confirmApprove(): void {
    const reg = this.selectedReg();
    if (!reg) return;

    this.isSubmitting.set(true);
    const selectedBedId = this.selectedBedId();
    const targetBedId = selectedBedId === null ? null : Number(selectedBedId);

    if (targetBedId !== null && !Number.isInteger(targetBedId)) {
      this.isSubmitting.set(false);
      alert('Mã giường được chọn không hợp lệ. Vui lòng chọn lại giường.');
      return;
    }

    this.registrationService.approveRegistration(reg.id, targetBedId).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.closeApproveModal();
        this.showSuccess(res.message || `Đã phê duyệt đơn đăng ký #${reg.id} cho sinh viên ${reg.user?.fullName}!`);
        this.loadData();
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);

        const responseError = err as {
          error?: { message?: unknown } | string;
          message?: unknown;
        };
        const backendMessage =
          typeof responseError.error === 'object' && responseError.error !== null
            ? responseError.error.message
            : responseError.error;
        const message =
          typeof backendMessage === 'string' && backendMessage.trim()
            ? backendMessage
            : typeof responseError.message === 'string' && responseError.message.trim()
              ? responseError.message
              : 'Không thể phê duyệt đơn đăng ký lúc này. Vui lòng thử lại sau.';

        // Nếu transaction đã commit nhưng response bị ngắt, đọc lại trạng thái
        // để không báo lỗi giả cho quản trị viên.
        this.registrationService.getRegistrationById(reg.id).subscribe({
          next: (latest) => {
            if (latest.status === 'APPROVED') {
              this.closeApproveModal();
              this.showSuccess(`Đơn đăng ký #${reg.id} đã được phê duyệt và đã ghi nhận trên hệ thống.`);
              this.loadData();
              return;
            }
            alert(message);
          },
          error: () => alert(message),
        });
      },
    });
  }

  // REJECT WORKFLOW
  openRejectModal(reg: Registration): void {
    this.selectedReg.set(reg);
    this.rejectForm.reset({
      rejectionReason: 'Hồ sơ chưa đạt tiêu chuẩn tiếp nhận trong đợt này.',
      presetReason: 'Hồ sơ chưa đạt tiêu chuẩn tiếp nhận trong đợt này.',
    });
    this.isRejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.isRejectModalOpen.set(false);
    this.selectedReg.set(null);
  }

  onPresetReasonChange(reason: string): void {
    if (reason) {
      this.rejectForm.patchValue({ rejectionReason: reason });
    }
  }

  confirmReject(): void {
    const reg = this.selectedReg();
    if (!reg || this.rejectForm.invalid) {
      this.rejectForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const reason = this.rejectForm.value.rejectionReason;

    this.registrationService.rejectRegistration(reg.id, reason).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeRejectModal();
        this.showSuccess(`Đã từ chối đơn đăng ký #${reg.id}!`);
        this.loadData();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        const message = err?.message || 'Không thể cập nhật quyết định cho đơn đăng ký. Vui lòng thử lại sau.';
        this.registrationService.getRegistrationById(reg.id).subscribe({
          next: (latest) => {
            if (latest.status === 'REJECTED') {
              this.closeRejectModal();
              this.showSuccess(`Đơn đăng ký #${reg.id} đã được ghi nhận là từ chối.`);
              this.loadData();
              return;
            }
            alert(message);
          },
          error: () => alert(message),
        });
      },
    });
  }

  resetFilters(): void {
    this.currentTab.set('PENDING');
    this.searchTerm.set('');
    this.selectedSemester.set('ALL');
  }

  formatSemester(semester: string | null | undefined): string {
    if (!semester || semester === 'H?c k? 1') {
      return 'Học kỳ 1';
    }

    return semester.replace(/\s*\((\d{4}\s*-\s*\d{4})\)\s*\(\d{4}\s*-\s*\d{4}\)\s*$/, ' ($1)');
  }

  private showSuccess(msg: string): void {
    this.actionSuccessMsg.set(msg);
    setTimeout(() => this.actionSuccessMsg.set(''), 5000);
  }
}
