import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; text-align: center;">
      <div style="font-size: 42px; margin-bottom: 12px;">🛠️</div>
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Quản Lý Báo Hỏng Cơ Sở Vật Chất</h2>
      <p style="color: #64748b; max-width: 520px; margin: 0 auto;">Khung giao diện điều phối kỹ thuật, cập nhật tiến độ xử lý sự cố thiết bị tại KTX.</p>
    </div>
  `
})
export class AdminMaintenanceComponent {}
