import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { AuthService } from '../../../core/services/auth.service';
import { Room } from '../../../core/models/room.model';
import { Registration } from '../../../core/models/registration.model';

export interface RoomOption {
  id: number;
  name: string;
}

@Component({
  selector: 'app-client-register-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-register-room.component.html',
  styleUrl: './client-register-room.component.css'
})
export class ClientRegisterRoomComponent implements OnInit {
  private fb = inject(FormBuilder);
  private roomService = inject(RoomService);
  private registrationService = inject(RegistrationService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  registerForm: FormGroup;
  isSubmitting = signal(false);
  isSuccess = signal(false);
  registrationCode = signal('');
  submitError = signal('');
  isLoadingRooms = signal(false);
  availableRooms: RoomOption[] = [];

  // My existing registrations list
  myRegistrations = signal<Registration[]>([]);
  isLoadingMyRegistrations = signal(false);
  cancelSuccessMsg = signal('');
  isLoggedIn = this.authService.isLoggedIn;
  currentUser = this.authService.currentUser;

  constructor() {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      studentCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{8,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['FEMALE', Validators.required],
      preferredRoomId: ['', Validators.required],
      semester: ['Học kỳ 1 (2026 - 2027)', Validators.required],
      academicYear: ['2026-2027', Validators.required],
      note: ['']
    });
  }

  ngOnInit(): void {
    this.autoFillUserData();
    this.loadAvailableRooms();
    if (this.isLoggedIn()) {
      this.loadMyRegistrations();
    }
  }

  private autoFillUserData(): void {
    const user = this.currentUser();
    if (user) {
      this.registerForm.patchValue({
        fullName: user.fullName || '',
        studentCode: user.studentCode || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || 'FEMALE',
      });
    }
  }

  loadMyRegistrations(): void {
    this.isLoadingMyRegistrations.set(true);
    this.registrationService.getMyRegistrations().subscribe({
      next: (list) => {
        this.myRegistrations.set(list);
        this.isLoadingMyRegistrations.set(false);
      },
      error: (err: Error) => {
        console.error('[loadMyRegistrations Error]', err);
        this.isLoadingMyRegistrations.set(false);
      },
    });
  }

  cancelRegistration(id: number): void {
    if (!confirm(`Bạn có chắc chắn muốn hủy đơn đăng ký #REG-${id}?`)) {
      return;
    }

    this.registrationService.cancelMyRegistration(id).subscribe({
      next: () => {
        this.cancelSuccessMsg.set(`Đã hủy đơn đăng ký #REG-${id} thành công!`);
        this.loadMyRegistrations();
        setTimeout(() => this.cancelSuccessMsg.set(''), 4000);
      },
      error: (err: Error) => alert(err.message || 'Lỗi khi hủy đơn đăng ký.'),
    });
  }

  private loadAvailableRooms(): void {
    this.isLoadingRooms.set(true);
    this.roomService.getRooms().subscribe({
      next: (rooms: Room[]) => {
        this.availableRooms = rooms.map((r) => {
          const vacantBeds = r.beds ? r.beds.filter(b => b.status === 'VACANT').length : (r.capacity - r.currentOccupancy);
          const priceFormatted = Number(r.pricePerMonth).toLocaleString('vi-VN');
          return {
            id: r.id,
            name: `Phòng ${r.roomNumber} - ${r.building} - Còn ${vacantBeds} chỗ - ${priceFormatted}đ/tháng`,
          };
        });
        this.isLoadingRooms.set(false);

        // Pre-select roomId from queryParams if present
        this.route.queryParams.subscribe((params) => {
          if (params['roomId']) {
            const requestedId = parseInt(params['roomId'], 10);
            if (this.availableRooms.some((r) => r.id === requestedId)) {
              this.registerForm.patchValue({ preferredRoomId: requestedId });
            }
          }
        });
      },
      error: (err: Error) => {
        console.error('[ClientRegisterRoomComponent loadRooms Error]', err);
        this.isLoadingRooms.set(false);
        this.submitError.set('Không thể tải danh sách phòng từ API máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');

    const formVal = this.registerForm.value;
    const dto = {
      fullName: formVal.fullName,
      studentCode: formVal.studentCode,
      email: formVal.email,
      phone: formVal.phone,
      gender: formVal.gender,
      roomId: parseInt(formVal.preferredRoomId, 10),
      semester: `${formVal.semester} (${formVal.academicYear})`,
      notes: formVal.note || undefined,
    };

    this.registrationService.createRegistration(dto).subscribe({
      next: (res: any) => {
        this.isSubmitting.set(false);
        this.isSuccess.set(true);
        const code = res?.data?.registrationCode || `REG-2026-${String(res?.data?.id || '0001').padStart(4, '0')}`;
        this.registrationCode.set(code);
        if (this.isLoggedIn()) {
          this.loadMyRegistrations();
        }
      },
      error: (err: Error) => {
        console.error('[Registration Submit Error]', err);
        this.isSubmitting.set(false);
        this.submitError.set(err.message || 'Lỗi khi gửi đơn đăng ký tới máy chủ API.');
      }
    });
  }

  resetForm(): void {
    this.isSuccess.set(false);
    this.submitError.set('');
    this.registerForm.reset({
      semester: 'Học kỳ 1 (2026 - 2027)',
      academicYear: '2026-2027'
    });
    this.autoFillUserData();
  }
}
