import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RegistrationRow {
  id: number;
  studentName: string;
  studentCode: string;
  gender: string;
  preferredRoom: string;
  semester: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  allocatedBed?: string;
  rejectionReason?: string;
}

@Component({
  selector: 'app-admin-registrations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-registrations.component.html',
  styleUrl: './admin-registrations.component.css'
})
export class AdminRegistrationsComponent {
  currentTab = signal<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Modal approve state
  selectedReg = signal<RegistrationRow | null>(null);
  selectedBed = signal('G1');
  availableBeds = ['G1 (Tầng 1)', 'G2 (Tầng 1)', 'G3 (Tầng 2)', 'G4 (Tầng 2)'];

  // Modal reject state
  rejectReg = signal<RegistrationRow | null>(null);
  rejectReason = signal('');

  registrations = signal<RegistrationRow[]>([
    {
      id: 1,
      studentName: 'Lê Hoàng Nam',
      studentCode: 'DTC235200112',
      gender: 'Nam',
      preferredRoom: 'A101 (Tòa A)',
      semester: 'Học kỳ 1 / 2026-2027',
      createdAt: '30/09/2026 08:15',
      status: 'PENDING'
    },
    {
      id: 2,
      studentName: 'Trần Thị Thu Thảo',
      studentCode: 'DTC235200204',
      gender: 'Nữ',
      preferredRoom: 'B101 (Tòa B)',
      semester: 'Học kỳ 1 / 2026-2027',
      createdAt: '30/09/2026 07:45',
      status: 'PENDING'
    },
    {
      id: 3,
      studentName: 'Vũ Đức Mạnh',
      studentCode: 'DTC235200155',
      gender: 'Nam',
      preferredRoom: 'A102 (Tòa A - VIP)',
      semester: 'Học kỳ 1 / 2026-2027',
      createdAt: '29/09/2026 16:30',
      status: 'PENDING'
    },
    {
      id: 4,
      studentName: 'Phạm Thị Ngọc Ánh',
      studentCode: 'DTC235200050',
      gender: 'Nữ',
      preferredRoom: 'A101 (Tòa A)',
      semester: 'Cả năm học 2026-2027',
      createdAt: '25/09/2026 10:00',
      status: 'APPROVED',
      allocatedBed: 'Giường G2'
    }
  ]);

  filteredList = computed(() => {
    const tab = this.currentTab();
    if (tab === 'ALL') return this.registrations();
    return this.registrations().filter(r => r.status === tab);
  });

  openApproveModal(reg: RegistrationRow): void {
    this.selectedReg.set(reg);
  }

  closeApproveModal(): void {
    this.selectedReg.set(null);
  }

  confirmApprove(): void {
    const reg = this.selectedReg();
    if (!reg) return;

    this.registrations.update(list =>
      list.map(item =>
        item.id === reg.id
          ? { ...item, status: 'APPROVED', allocatedBed: this.selectedBed() }
          : item
      )
    );
    this.closeApproveModal();
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

    this.registrations.update(list =>
      list.map(item =>
        item.id === reg.id
          ? { ...item, status: 'REJECTED', rejectionReason: this.rejectReason() || 'Không đáp ứng điều kiện' }
          : item
      )
    );
    this.closeRejectModal();
  }
}
