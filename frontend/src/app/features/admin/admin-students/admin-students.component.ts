import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StudentService } from '../../../core/services/student.service';
import { CreateStudentDto, StudentProfile, UpdateStudentDto } from '../../../core/models/student.model';

@Component({
  selector: 'app-admin-students',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-students.component.html',
  styleUrl: './admin-students.component.css'
})
export class AdminStudentsComponent implements OnInit {
  private studentService = inject(StudentService);
  private fb = inject(FormBuilder);

  students = signal<StudentProfile[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  actionSuccessMsg = signal('');

  // Filters
  searchTerm = signal('');
  selectedGender = signal('ALL');
  selectedStatus = signal('ALL');

  // Modals state
  isCreateModalOpen = signal(false);
  isDetailModalOpen = signal(false);
  isEditModalOpen = signal(false);

  selectedStudent = signal<StudentProfile | null>(null);

  // Forms
  createForm: FormGroup;
  editForm: FormGroup;

  filteredStudents = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const gender = this.selectedGender();
    const status = this.selectedStatus();

    return this.students().filter((s) => {
      const matchSearch =
        !search ||
        s.fullName.toLowerCase().includes(search) ||
        s.studentCode.toLowerCase().includes(search) ||
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
  }

  ngOnInit(): void {
    this.loadStudents();
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
        this.errorMessage.set(err.message || 'Không thể tải danh sách hồ sơ sinh viên từ API.');
        this.isLoading.set(false);
      },
    });
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
        this.actionSuccessMsg.set(`Đã tạo mới thành công hồ sơ sinh viên ${dto.fullName} (${dto.studentCode})!`);
        this.closeCreateModal();
        this.loadStudents();
        setTimeout(() => this.actionSuccessMsg.set(''), 5000);
      },
      error: (err: Error) => {
        alert(err.message || 'Lỗi khi tạo mới hồ sơ sinh viên.');
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
        this.actionSuccessMsg.set(`Đã cập nhật hồ sơ sinh viên ${dto.fullName} thành công!`);
        this.closeEditModal();
        this.loadStudents();
        setTimeout(() => this.actionSuccessMsg.set(''), 5000);
      },
      error: (err: Error) => {
        alert(err.message || 'Lỗi khi cập nhật hồ sơ sinh viên.');
      },
    });
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedGender.set('ALL');
    this.selectedStatus.set('ALL');
  }
}
