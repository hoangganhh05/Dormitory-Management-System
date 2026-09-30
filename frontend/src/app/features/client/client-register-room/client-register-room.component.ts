import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-register-room',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="padding: 32px 20px;">
      <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Đăng Ký Lưu Trú Trực Tuyến</h2>
      <p style="color: var(--text-muted); margin-bottom: 24px;">Biểu mẫu nộp hồ sơ xin ở Ký túc xá trực tuyến dành cho sinh viên.</p>
      
      <div style="background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 40px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 12px;">📝</div>
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">Biểu mẫu đăng ký lưu trú</h3>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto;">Khung giao diện đăng ký đã được định tuyến sẵn, sẽ hoàn thiện form nhập liệu ở task KTX-013.</p>
      </div>
    </div>
  `
})
export class ClientRegisterRoomComponent {}
