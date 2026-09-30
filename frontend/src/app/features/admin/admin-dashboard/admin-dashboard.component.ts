import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  // Mock metrics aligned with seed data
  stats = [
    { label: 'Tổng số phòng KTX', value: '4 Phòng', sub: '100% Sẵn sàng hoạt động', icon: '🏢', color: 'blue' },
    { label: 'Sức chứa / Đã ở', value: '3 / 16 Giường', sub: 'Tỷ lệ lấp đầy: 18.7%', icon: '🛏️', color: 'green' },
    { label: 'Đơn đăng ký chờ duyệt', value: '3 Đơn', sub: 'Cần ban quản lý duyệt', icon: '📝', color: 'amber' },
    { label: 'Sự cố cần sửa chữa', value: '1 Yêu cầu', sub: 'Đang điều phối kỹ thuật', icon: '🛠️', color: 'danger' },
  ];

  recentRegistrations = [
    { student: 'Lê Hoàng Nam', code: 'DTC235200112', room: 'A101 (Tòa A)', date: 'Hôm nay 08:15', status: 'PENDING' },
    { student: 'Trần Thị Thu Thảo', code: 'DTC235200204', room: 'B101 (Tòa B)', date: 'Hôm nay 07:45', status: 'PENDING' },
    { student: 'Vũ Đức Mạnh', code: 'DTC235200155', room: 'A102 (Tòa A - VIP)', date: 'Hôm qua 16:30', status: 'PENDING' },
  ];

  recentIssues = [
    { room: 'Phòng A101', title: 'Hỏng công tắc quạt trần', urgency: 'HIGH', status: 'PROCESSING', date: '30/09/2026' },
  ];

  buildingStats = [
    { name: 'Tòa A (Khu Sinh viên Nam)', capacity: 6, occupied: 2, percent: 33 },
    { name: 'Tòa B (Khu Sinh viên Nữ)', capacity: 6, occupied: 1, percent: 17 },
  ];
}
