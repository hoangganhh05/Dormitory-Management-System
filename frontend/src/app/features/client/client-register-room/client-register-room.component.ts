import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-register-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './client-register-room.component.html',
  styleUrl: './client-register-room.component.css'
})
export class ClientRegisterRoomComponent {
  registerForm: FormGroup;
  isSubmitting = signal(false);
  isSuccess = signal(false);
  registrationCode = signal('');

  availableRooms = [
    { id: 1, name: 'Phòng A101 - Tòa A (Nam) - Còn 3 giường - 450.000đ/tháng' },
    { id: 2, name: 'Phòng A102 - Tòa A (VIP Nam) - Còn 2 giường - 750.000đ/tháng' },
    { id: 3, name: 'Phòng B101 - Tòa B (Nữ) - Còn 3 giường - 450.000đ/tháng' },
  ];

  constructor(private fb: FormBuilder) {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      studentCode: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9]{8,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      gender: ['FEMALE', Validators.required],
      preferredRoomId: ['', Validators.required],
      semester: ['Học kỳ 1', Validators.required],
      academicYear: ['2026-2027', Validators.required],
      note: ['']
    });
  }

  // Getters for form validation checks
  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    // Simulate server call
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.isSuccess.set(true);
      this.registrationCode.set('REG-' + Math.floor(100000 + Math.random() * 900000));
    }, 1000);
  }

  resetForm(): void {
    this.isSuccess.set(false);
    this.registerForm.reset({
      gender: 'FEMALE',
      semester: 'Học kỳ 1',
      academicYear: '2026-2027'
    });
  }
}
