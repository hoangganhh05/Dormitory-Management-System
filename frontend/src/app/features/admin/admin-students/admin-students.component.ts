import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StudentService } from '../../../core/services/student.service';
import { AllocationService } from '../../../core/services/allocation.service';
import { CreateStudentDto, StudentProfile, UpdateStudentDto } from '../../../core/models/student.model';
import {
  AllocationHistoryItem,
  AllocationStatsSummary,
  AvailableBedItem,
} from '../../../core/models/allocation.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideBedDouble, lucideCheck, lucideClipboardList, lucidePlus, lucideSearch, lucideUsers, lucideX } from '@ng-icons/lucide';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIcon],
  providers: [provideIcons({ lucideAlertTriangle, lucideBedDouble, lucideCheck, lucideClipboardList, lucidePlus, lucideSearch, lucideUsers, lucideX })],
  templateUrl: './admin-students.component.html',
  styleUrl: './admin-students.component.css'
})
export class AdminStudentsComponent implements OnInit {
  private studentService = inject(StudentService);
  private allocationService = inject(AllocationService);
  private fb = inject(FormBuilder);

  // Main navigation view: Danh sách sinh viên VS Nhật ký điều chuyển
  activeViewTab = signal<'STUDENTS' | 'HISTORY'>('STUDENTS');

  students = signal<StudentProfile[]>([]);
  allocationStats = signal<AllocationStatsSummary | null>(null);
  globalHistories = signal<AllocationHistoryItem[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  actionSuccessMsg = signal('');

  // Filters for Students
  searchTerm = signal('');
  selectedGender = signal('ALL');
  selectedStatus = signal('ALL');

  // Filters for History
  historyActionFilter = signal('ALL');
  historySearchTerm = signal('');

  // Modals state
  isCreateModalOpen = signal(false);
  isDetailModalOpen = signal(false);
  isEditModalOpen = signal(false);
  isAllocateModalOpen = signal(false);
  isTransferModalOpen = signal(false);
  isHistoryModalOpen = signal(false);
  isSubmitting = signal(false);

  selectedStudent = signal<StudentProfile | null>(null);
  availableBeds = signal<AvailableBedItem[]>([]);
  studentHistories = signal<AllocationHistoryItem[]>([]);

  // Forms
  createForm: FormGroup;
  editForm: FormGroup;
  allocationForm: FormGroup;
  transferForm: FormGroup;

  filteredStudents = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const gender = this.selectedGender();
    const status = this.selectedStatus();

    return this.students().filter((s) => {
      const matchSearch =
        !search ||
        s.fullName.toLowerCase().includes(search) ||
        (s.studentCode && s.studentCode.toLowerCase().includes(search)) ||
        s.email.toLowerCase().includes(search) ||
        (s.phone && s.phone.includes(search));

      const matchGender = gender === 'ALL' || s.gender === gender;

      const matchStatus =
        status === 'ALL' ||
        (status === 'HOUSED' && !!s.occupiedBed) ||
        (status === 'UNASSIGNED' && !s.occupiedBed);

      return matchSearch && matchGender && matchStatus;
    });
  });

  filteredHistories = computed(() => {
    const action = this.historyActionFilter();
    const search = this.historySearchTerm().toLowerCase().trim();

    return this.globalHistories().filter((h) => {
      const matchAction = action === 'ALL' || h.actionType === action;
      const matchSearch =
        !search ||
        (h.user?.fullName && h.user.fullName.toLowerCase().includes(search)) ||
        (h.user?.studentCode && h.user.studentCode.toLowerCase().includes(search)) ||
        (h.fromBedInfo && h.fromBedInfo.toLowerCase().includes(search)) ||
        (h.toBedInfo && h.toBedInfo.toLowerCase().includes(search)) ||
        (h.note && h.note.toLowerCase().includes(search));

      return matchAction && matchSearch;
    });
  });

  housedCount = computed(() => this.students().filter((s) => !!s.occupiedBed).length);
  unassignedCount = computed(() => this.students().filter((s) => !s.occupiedBed).length);

  constructor() {
    this.createForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      studentCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{8,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['FEMALE', Validators.required],
      defaultPassword: ['123456', [Validators.required, Validators.minLength(6)]],
    });

    this.editForm = this.fb.group({
      id: [null],
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      studentCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{8,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['FEMALE', Validators.required],
    });

    this.allocationForm = this.fb.group({
      bedId: [null, Validators.required],
      note: ['Phân giường lưu trú đợt học kỳ mới'],
    });

    this.transferForm = this.fb.group({
      targetBedId: [null, Validators.required],
      note: ['Điều chuyển phòng/giường theo sắp xếp'],
    });
  }

  ngOnInit(): void {
    this.loadStudents();
    this.loadAllocationStats();
  }

  loadStudents(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.studentService.getAllStudents().subscribe({
      next: (list) => {
        this.students.set(list);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('[AdminStudentsComponent load Error]', err);
        this.errorMessage.set('Không thể tải danh sách hồ sơ sinh viên. Vui lòng thử lại sau.');
        this.isLoading.set(false);
      },
    });
  }

  loadAllocationStats(): void {
    this.allocationService.getAllocationStats().subscribe({
      next: (st) => this.allocationStats.set(st),
      error: (err) => console.error('[AllocationStats Error]', err),
    });
  }

  loadGlobalHistories(): void {
    this.isLoading.set(true);
    this.allocationService.getAllocationHistory().subscribe({
      next: (histories) => {
        this.globalHistories.set(histories);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('[loadGlobalHistories Error]', err);
        this.isLoading.set(false);
      },
    });
  }

  switchTab(tab: 'STUDENTS' | 'HISTORY'): void {
    this.activeViewTab.set(tab);
    if (tab === 'HISTORY') {
      this.loadGlobalHistories();
    } else {
      this.loadStudents();
    }
  }

  // CREATE STUDENT
  openCreateModal(): void {
    this.createForm.reset({
      gender: 'FEMALE',
      defaultPassword: '123456',
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreateStudent(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const val = this.createForm.value;
    const dto: CreateStudentDto = {
      fullName: val.fullName,
      studentCode: val.studentCode,
      email: val.email,
      phone: val.phone || undefined,
      gender: val.gender,
      defaultPassword: val.defaultPassword,
    };

    this.studentService.createStudent(dto).subscribe({
      next: () => {
        this.showSuccess(`Đã tạo mới thành công hồ sơ sinh viên ${dto.fullName} (${dto.studentCode})!`);
        this.closeCreateModal();
        this.loadStudents();
        this.loadAllocationStats();
      },
      error: (err: Error) => {
        alert('Không thể tạo hồ sơ sinh viên. Vui lòng thử lại sau.');
      },
    });
  }

  // VIEW DETAIL
  openDetailModal(student: StudentProfile): void {
    this.selectedStudent.set(student);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedStudent.set(null);
  }

  // EDIT STUDENT
  openEditModal(student: StudentProfile): void {
    this.selectedStudent.set(student);
    this.editForm.patchValue({
      id: student.id,
      fullName: student.fullName,
      studentCode: student.studentCode,
      email: student.email,
      phone: student.phone || '',
      gender: student.gender,
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedStudent.set(null);
  }

  submitUpdateStudent(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const val = this.editForm.value;
    const dto: UpdateStudentDto = {
      fullName: val.fullName,
      studentCode: val.studentCode,
      email: val.email,
      phone: val.phone || undefined,
      gender: val.gender,
    };

    this.studentService.updateStudent(val.id, dto).subscribe({
      next: () => {
        this.showSuccess(`Đã cập nhật hồ sơ sinh viên ${dto.fullName} thành công!`);
        this.closeEditModal();
        this.loadStudents();
      },
      error: (err: Error) => {
        alert('Không thể cập nhật hồ sơ sinh viên. Vui lòng thử lại sau.');
      },
    });
  }

  // --- KTX-024 ALLOCATION & TRACKING METHODS ---

  // 1. ALLOCATE BED (Check-in)
  openAllocateModal(student: StudentProfile): void {
    this.selectedStudent.set(student);
    this.availableBeds.set([]);
    this.allocationForm.reset({
      bedId: null,
      note: `Phân bổ giường lưu trú cho SV ${student.fullName}`,
    });

    this.allocationService.getAvailableBeds({ gender: student.gender }).subscribe({
      next: (beds) => {
        this.availableBeds.set(beds);
        if (beds.length > 0) {
          this.allocationForm.patchValue({ bedId: beds[0].id });
        }
        this.isAllocateModalOpen.set(true);
      },
      error: () => alert('Không thể tải danh sách giường trống. Vui lòng thử lại sau.'),
    });
  }

  closeAllocateModal(): void {
    this.isAllocateModalOpen.set(false);
    this.selectedStudent.set(null);
  }

  submitAllocateBed(): void {
    const student = this.selectedStudent();
    if (!student || this.allocationForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.allocationForm.value;

    this.allocationService.allocateBed({
      studentId: student.id,
      bedId: Number(formVal.bedId),
      note: formVal.note,
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.closeAllocateModal();
        this.showSuccess(res.message || `Đã phân giường cho sinh viên ${student.fullName} thành công!`);
        this.loadStudents();
        this.loadAllocationStats();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        alert('Không thể phân bổ giường. Vui lòng thử lại sau.');
      },
    });
  }

  // 2. TRANSFER BED
  openTransferModal(student: StudentProfile): void {
    this.selectedStudent.set(student);
    this.availableBeds.set([]);
    this.transferForm.reset({
      targetBedId: null,
      note: `Điều chuyển giường cho SV ${student.fullName}`,
    });

    this.allocationService.getAvailableBeds({ gender: student.gender }).subscribe({
      next: (beds) => {
        this.availableBeds.set(beds);
        if (beds.length > 0) {
          this.transferForm.patchValue({ targetBedId: beds[0].id });
        }
        this.isTransferModalOpen.set(true);
      },
      error: () => alert('Không thể tải danh sách giường trống. Vui lòng thử lại sau.'),
    });
  }

  closeTransferModal(): void {
    this.isTransferModalOpen.set(false);
    this.selectedStudent.set(null);
  }

  submitTransferBed(): void {
    const student = this.selectedStudent();
    if (!student || this.transferForm.invalid) return;

    this.isSubmitting.set(true);
    const formVal = this.transferForm.value;

    this.allocationService.transferBed({
      studentId: student.id,
      targetBedId: Number(formVal.targetBedId),
      note: formVal.note,
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.closeTransferModal();
        this.showSuccess(res.message || `Đã chuyển giường cho sinh viên ${student.fullName}!`);
        this.loadStudents();
        this.loadAllocationStats();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        alert('Không thể điều chuyển giường. Vui lòng thử lại sau.');
      },
    });
  }

  // 3. CHECK-OUT
  confirmCheckOut(student: StudentProfile): void {
    if (!student.occupiedBed) return;

    const bedText = `Phòng ${student.occupiedBed.room?.roomNumber} - Giường ${student.occupiedBed.bedNumber}`;
    if (!confirm(`Xác nhận trả phòng và giải phóng ${bedText} cho sinh viên ${student.fullName}?`)) {
      return;
    }

    this.allocationService.checkOut({
      studentId: student.id,
      note: 'Sinh viên hoàn tất thủ tục trả phòng và rời KTX',
    }).subscribe({
      next: (res) => {
        this.showSuccess(res.message || `Đã hoàn tất trả phòng cho sinh viên ${student.fullName}!`);
        this.loadStudents();
        this.loadAllocationStats();
      },
      error: () => alert('Không thể hoàn tất thủ tục trả phòng. Vui lòng thử lại sau.'),
    });
  }

  // 4. STUDENT HISTORY
  openHistoryModal(student: StudentProfile): void {
    this.selectedStudent.set(student);
    this.studentHistories.set([]);
    this.isHistoryModalOpen.set(true);

    this.allocationService.getAllocationHistory({ studentId: student.id }).subscribe({
      next: (histories) => this.studentHistories.set(histories),
      error: (err: Error) => console.error('[openHistoryModal Error]', err),
    });
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen.set(false);
    this.selectedStudent.set(null);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedGender.set('ALL');
    this.selectedStatus.set('ALL');
  }

  private showSuccess(msg: string): void {
    this.actionSuccessMsg.set(msg);
    setTimeout(() => this.actionSuccessMsg.set(''), 5000);
  }
}
