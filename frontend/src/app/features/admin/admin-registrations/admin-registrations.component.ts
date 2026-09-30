import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-registrations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; text-align: center;">
      <div style="font-size: 42px; margin-bottom: 12px;">📝</div>
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Duyệt Đơn Đăng Ký Lưu Trú</h2>
      <p style="color: #64748b; max-width: 520px; margin: 0 auto;">Khung giao diện xét duyệt đơn và tự động phân phòng/giường cho sinh viên.</p>
    </div>
  `
})
export class AdminRegistrationsComponent {}
