import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrationService } from '../../../core/services/registration.service';
import { Registration } from '../../../core/models/registration.model';

export interface RegistrationRow {
  id: number;
  studentName: string;
  studentCode: string;
  gender: string;
  preferredRoom: string;
  preferredRoomId?: number | null;
  semester: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  allocatedBed?: string;
  allocatedBedId?: number | null;
  rejectionReason?: string;
  availableBeds?: { id: number; name: string }[];
}

@Component({
  selector: 'app-admin-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-registrations.component.html',
  styleUrl: './admin-registrations.component.css'
})
export class AdminRegistrationsComponent implements OnInit {
  private registrationService = inject(RegistrationService);

  currentTab = signal<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  isLoading = signal(true);
  errorMessage = signal('');
  actionSuccessMsg = signal('');

  // Modal approve state
  selectedReg = signal<RegistrationRow | null>(null);
  selectedBed = signal('G1');
  selectedBedId = signal<number | null>(null);
  availableBeds = signal<{ id: number; name: string }[]>([
    { id: 1, name: 'Giường G1 (Tầng 1)' },
    { id: 2, name: 'Giường G2 (Tầng 1)' },
    { id: 3, name: 'Giường G3 (Tầng 2)' },
    { id: 4, name: 'Giường G4 (Tầng 2)' },
  ]);

  // Modal reject state
  rejectReg = signal<RegistrationRow | null>(null);
  rejectReason = signal('');

  // Real registrations from API
  registrations = signal<RegistrationRow[]>([]);

  filteredList = computed(() => {
    const tab = this.currentTab();
    if (tab === 'ALL') return this.registrations();
    return this.registrations().filter(r => r.status === tab);
  });

  pendingCount = computed(() => this.registrations().filter(r => r.status === 'PENDING').length);
  approvedCount = computed(() => this.registrations().filter(r => r.status === 'APPROVED').length);
  rejectedCount = computed(() => this.registrations().filter(r => r.status === 'REJECTED').length);

  ngOnInit(): void {
    this.loadRegistrations();
  }

  loadRegistrations(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.registrationService.getRegistrations().subscribe({
      next: (apiList: Registration[]) => {
        const rows: RegistrationRow[] = apiList.map((item) => {
          const roomBeds = item.preferredRoom?.beds || [];
          const vacantBeds = roomBeds
            .filter((b) => b.status === 'VACANT')
            .map((b) => ({ id: b.id, name: `Giường ${b.bedNumber} (Phòng ${item.preferredRoom?.roomNumber})` }));

          return {
            id: item.id,
            studentName: item.user?.fullName || 'Sinh viên KTX',
            studentCode: item.user?.studentCode || 'N/A',
            gender: item.user?.gender === 'FEMALE' ? 'Nữ' : 'Nam',
            preferredRoom: item.preferredRoom ? `${item.preferredRoom.roomNumber} (${item.preferredRoom.building})` : 'Chưa xếp phòng',
            preferredRoomId: item.preferredRoomId,
            semester: item.semester,
            createdAt: new Date(item.createdAt).toLocaleString('vi-VN'),
            status: item.status as 'PENDING' | 'APPROVED' | 'REJECTED',
            allocatedBed: item.allocatedBed ? `Giường ${item.allocatedBed.bedNumber}` : undefined,
            allocatedBedId: item.allocatedBedId,
            rejectionReason: item.rejectionReason,
            availableBeds: vacantBeds.length > 0 ? vacantBeds : undefined,
          };
        });

        this.registrations.set(rows);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('[AdminRegistrations loadRegistrations Error]', err);
        this.errorMessage.set('Không thể kết nối đến máy chủ lấy danh sách đơn đăng ký. Vui lòng kiểm tra API.');
        this.isLoading.set(false);
      }
    });
  }

  openApproveModal(reg: RegistrationRow): void {
    this.selectedReg.set(reg);
    if (reg.availableBeds && reg.availableBeds.length > 0) {
      this.availableBeds.set(reg.availableBeds);
      this.selectedBed.set(reg.availableBeds[0].name);
      this.selectedBedId.set(reg.availableBeds[0].id);
    } else {
      this.availableBeds.set([
        { id: 1, name: 'Giường G1 (Tầng 1)' },
        { id: 2, name: 'Giường G2 (Tầng 1)' },
        { id: 3, name: 'Giường G3 (Tầng 2)' },
        { id: 4, name: 'Giường G4 (Tầng 2)' },
      ]);
      this.selectedBed.set('Giường G1 (Tầng 1)');
      this.selectedBedId.set(1);
    }
  }

  closeApproveModal(): void {
    this.selectedReg.set(null);
  }

  confirmApprove(): void {
    const reg = this.selectedReg();
    if (!reg) return;

    this.registrationService.approveRegistration(reg.id, this.selectedBedId() || undefined).subscribe({
      next: () => {
        this.actionSuccessMsg.set(`Đã phê duyệt thành công đơn đăng ký #${reg.id} cho sinh viên ${reg.studentName}!`);
        this.closeApproveModal();
        this.loadRegistrations();
        setTimeout(() => this.actionSuccessMsg.set(''), 5000);
      },
      error: (err: Error) => {
        console.error('[Approve Error]', err);
        alert(err.message || 'Lỗi khi phê duyệt đơn trên máy chủ.');
      }
    });
  }

  openRejectModal(reg: RegistrationRow): void {
    this.rejectReg.set(reg);
    this.rejectReason.set('');
  }

  closeRejectModal(): void {
    this.rejectReg.set(null);
  }

  confirmReject(): void {
    const reg = this.rejectReg();
    if (!reg) return;

    const reason = this.rejectReason() || 'Không đủ chỉ tiêu tiếp nhận';
    this.registrationService.rejectRegistration(reg.id, reason).subscribe({
      next: () => {
        this.actionSuccessMsg.set(`Đã từ chối đơn đăng ký #${reg.id}.`);
        this.closeRejectModal();
        this.loadRegistrations();
        setTimeout(() => this.actionSuccessMsg.set(''), 5000);
      },
      error: (err: Error) => {
        console.error('[Reject Error]', err);
        alert(err.message || 'Lỗi khi từ chối đơn trên máy chủ.');
      }
    });
  }
}
