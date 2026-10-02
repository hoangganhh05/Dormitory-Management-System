import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { SettingsService, DormitorySettings } from '../../../core/services/settings.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentProfile } from '../../../core/models/student.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBedDouble, lucideBuilding2, lucideCheckCircle, lucideClipboardList, lucideFileText, lucideHouse, lucideTriangleAlert, lucideUsers, lucideWrench, lucideX } from '@ng-icons/lucide';

@Component({
  selector: 'app-client-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NgIcon],
  providers: [provideIcons({ lucideBedDouble, lucideBuilding2, lucideCheckCircle, lucideClipboardList, lucideFileText, lucideHouse, lucideTriangleAlert, lucideUsers, lucideWrench, lucideX })],
  templateUrl: './client-profile.component.html',
  styleUrl: './client-profile.component.css',
})
export class ClientProfileComponent implements OnInit {
  private studentService = inject(StudentService);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  profile = signal<StudentProfile | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  updateSuccessMsg = signal('');
  isUpdatingPhone = signal(false);
  isEditingPhone = signal(false);
  openingHour = '';
  closingHour = '';
  currentTermLabel = '';

  phoneForm: FormGroup;

  constructor() {
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadSettings();
  }

  private loadSettings(): void {
    this.settingsService.getPublicSettings().subscribe((response) => {
      const settings: DormitorySettings = response.success ? response.data : {};
      this.openingHour = settings['OPENING_HOUR'] || '';
      this.closingHour = settings['CLOSING_HOUR'] || '';
      this.currentTermLabel = [settings['CURRENT_SEMESTER'], settings['CURRENT_ACADEMIC_YEAR']]
        .filter(Boolean)
        .join(' ');
    });
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.studentService.getMyProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.phoneForm.patchValue({ phone: data.phone || '' });
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('[ClientProfileComponent Error]', err);
        this.errorMessage.set('Không thể tải hồ sơ lưu trú cá nhân. Vui lòng thử lại sau.');
        this.isLoading.set(false);
      },
    });
  }

  toggleEditPhone(): void {
    if (!this.isEditingPhone()) {
      this.phoneForm.patchValue({ phone: this.profile()?.phone || '' });
      this.isEditingPhone.set(true);
    } else {
      this.isEditingPhone.set(false);
    }
  }

  submitUpdatePhone(): void {
    if (this.phoneForm.invalid) {
      this.phoneForm.markAllAsTouched();
      return;
    }

    const newPhone = this.phoneForm.value.phone;
    this.isUpdatingPhone.set(true);
    this.updateSuccessMsg.set('');

    this.studentService.updateMyPhone(newPhone).subscribe({
      next: () => {
        this.isUpdatingPhone.set(false);
        this.isEditingPhone.set(false);
        this.updateSuccessMsg.set('Cập nhật số điện thoại liên lạc thành công!');
        if (this.profile()) {
          this.profile.update((prev) => (prev ? { ...prev, phone: newPhone } : null));
        }
        setTimeout(() => this.updateSuccessMsg.set(''), 4000);
      },
      error: (err: Error) => {
        this.isUpdatingPhone.set(false);
        alert('Không thể cập nhật số điện thoại. Vui lòng thử lại sau.');
      },
    });
  }
}
