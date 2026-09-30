import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-rooms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container" style="padding: 32px 20px;">
      <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">Tra Cứu Phòng Trống</h2>
      <p style="color: var(--text-muted); margin-bottom: 24px;">Danh sách phòng Ký túc xá phục vụ sinh viên nộp hồ sơ lưu trú.</p>
      
      <div style="background: #fff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 40px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 12px;">🏢</div>
        <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 6px;">Bộ lọc và danh sách phòng</h3>
        <p style="color: var(--text-muted); max-width: 480px; margin: 0 auto;">Khung giao diện tra cứu phòng đã sẵn sàng, sẽ được kết nối dữ liệu chi tiết ở các task nghiệp vụ tiếp theo.</p>
      </div>
    </div>
  `
})
export class ClientRoomsComponent {}
