import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-maintenance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="padding: 32px 20px;">
      <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Báo Hỏng Cơ Sở Vật Chất</h2>
      <p style="color: var(--text-muted); margin-bottom: 24px;">Gửi phiếu phản ánh sự cố kỹ thuật phòng tới Ban Quản lý Ký túc xá.</p>
      
      <div style="background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 40px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 12px;">🛠️</div>
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">Tiếp nhận phản ánh & Báo hỏng</h3>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto;">Khung giao diện báo hỏng thiết bị sẵn sàng để bổ sung biểu mẫu tạo phiếu và theo dõi trạng thái.</p>
      </div>
    </div>
  `
})
export class ClientMaintenanceComponent {}
