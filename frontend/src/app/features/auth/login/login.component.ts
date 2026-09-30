import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Active view: 'login' | 'forgot'
  currentView = signal<'login' | 'forgot'>('login');
  activeRole = signal<'STUDENT' | 'ADMIN'>('STUDENT');
  showPassword = signal(false);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  loginForm: FormGroup;
  forgotForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [true]
    });

    this.forgotForm = this.fb.group({
      emailOrStudentCode: ['', [Validators.required, Validators.minLength(3)]]
    });

    // Check query params for alerts
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.errorMessage.set(params['error']);
      }
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  get forgotF() {
    return this.forgotForm.controls;
  }

  switchRole(role: 'STUDENT' | 'ADMIN'): void {
    this.activeRole.set(role);
    this.errorMessage.set('');
    this.loginForm.reset({
      identifier: '',
      password: '',
      rememberMe: true
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { identifier, password } = this.loginForm.value;

    this.authService.login(identifier, password).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        // Redirect according to user role
        if (user.role === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/client/dashboard']);
        }
      },
      error: (err: Error) => {
        console.error('[Login Error]', err);
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
      }
    });
  }

  onForgotSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { emailOrStudentCode } = this.forgotForm.value;

    this.authService.forgotPassword(emailOrStudentCode).subscribe({
      next: (msg) => {
        this.isLoading.set(false);
        this.successMessage.set(msg);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.message || 'Không thể khôi phục mật khẩu. Vui lòng kiểm tra lại thông tin.');
      }
    });
  }

  // Quick fill demo credentials for reviewers & testing
  fillDemoCredentials(type: 'student' | 'admin'): void {
    if (type === 'student') {
      this.activeRole.set('STUDENT');
      this.loginForm.patchValue({
        identifier: 'DTC235200050',
        password: '123456'
      });
    } else {
      this.activeRole.set('ADMIN');
      this.loginForm.patchValue({
        identifier: 'admin@dormitory.com',
        password: '123456'
      });
    }
  }
}
