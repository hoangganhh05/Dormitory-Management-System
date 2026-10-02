import { AfterViewInit, Component, ElementRef, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';
import { environment } from '../../../../environments/environment';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideCheckCircle, lucideEye, lucideEyeOff, lucideLockKeyhole, lucideShieldCheck, lucideUser } from '@ng-icons/lucide';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIcon],
  providers: [provideIcons({ lucideAlertTriangle, lucideCheckCircle, lucideEye, lucideEyeOff, lucideLockKeyhole, lucideShieldCheck, lucideUser })],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private googleIdentityService = inject(GoogleIdentityService);

  @ViewChild('googleButton') googleButton?: ElementRef<HTMLElement>;

  // Active view: 'login' | 'forgot'
  currentView = signal<'login' | 'forgot'>('login');
  activeRole = signal<'STUDENT' | 'ADMIN'>('STUDENT');
  showPassword = signal(false);

  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  googleLoginAvailable = Boolean(
    environment.googleClientId && !environment.googleClientId.startsWith('YOUR_GOOGLE_CLIENT_ID')
  );

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

  ngAfterViewInit(): void {
    if (!this.googleLoginAvailable) return;

    const element = this.googleButton?.nativeElement;
    if (!element) return;

    this.googleIdentityService.renderButton(element, (idToken) => this.onGoogleCredential(idToken)).catch((error: Error) => {
      // Client ID có thể chưa được cấp ở môi trường local; không làm hỏng đăng nhập mật khẩu.
      console.warn('[Google login]', error.message);
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
        this.errorMessage.set('Tài khoản hoặc mật khẩu không chính xác.');
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
        this.errorMessage.set('Không thể khôi phục mật khẩu. Vui lòng kiểm tra lại thông tin.');
      }
    });
  }

  private onGoogleCredential(idToken: string): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.googleLogin(idToken).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/client/home']);
      },
      error: (err: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.message.includes('@ictu.edu.vn')
            ? 'Vui lòng chọn tài khoản có đuôi @ictu.edu.vn.'
            : err.message || 'Không thể đăng nhập bằng Google ICTU.'
        );
      },
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
