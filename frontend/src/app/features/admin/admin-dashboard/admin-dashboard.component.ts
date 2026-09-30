import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardStats } from '../../../core/models/dashboard.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');

  stats = signal([
    { label: 'Tổng số phòng KTX', value: '0 Phòng', sub: 'Đang kết nối API...', icon: '🏢', color: 'blue' },
    { label: 'Sức chứa / Đã ở', value: '0 / 0 Giường', sub: 'Tỷ lệ lấp đầy: 0%', icon: '🛏️', color: 'green' },
    { label: 'Đơn đăng ký chờ duyệt', value: '0 Đơn', sub: 'Cần ban quản lý duyệt', icon: '📝', color: 'amber' },
    { label: 'Sự cố cần sửa chữa', value: '0 Yêu cầu', sub: 'Đang điều phối kỹ thuật', icon: '🛠️', color: 'danger' },
  ]);

  recentRegistrations = signal<any[]>([]);
  recentIssues = signal<any[]>([]);
  buildingStats = signal<any[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    this.dashboardService.getStats().subscribe({
      next: (data: DashboardStats) => {
        this.stats.set([
          {
            label: 'Tổng số phòng KTX',
            value: `${data.totalRooms} Phòng`,
            sub: '100% Sẵn sàng hoạt động',
            icon: '🏢',
            color: 'blue'
          },
          {
            label: 'Sức chứa / Đã ở',
            value: `${data.occupiedBeds} / ${data.totalBeds} Giường`,
            sub: `Tỷ lệ lấp đầy: ${data.occupancyRate}%`,
            icon: '🛏️',
            color: 'green'
          },
          {
            label: 'Đơn đăng ký chờ duyệt',
            value: `${data.pendingRegistrations} Đơn`,
            sub: 'Cần ban quản lý duyệt',
            icon: '📝',
            color: 'amber'
          },
          {
            label: 'Sự cố cần sửa chữa',
            value: `${data.urgentIssues} Yêu cầu`,
            sub: 'Đang điều phối kỹ thuật',
            icon: '🛠️',
            color: 'danger'
          },
        ]);

        // Building stats
        const bStats: any[] = [];
        if (data.buildingStats) {
          Object.keys(data.buildingStats).forEach((bName) => {
            const b = data.buildingStats[bName];
            const pct = b.total > 0 ? Math.round((b.occupied / b.total) * 100) : 0;
            bStats.push({
              name: bName,
              capacity: b.total,
              occupied: b.occupied,
              percent: pct,
            });
          });
        }
        this.buildingStats.set(bStats);

        // Recent registrations
        const recentRegs = (data.recentRegistrations || []).map((r) => ({
          student: r.user?.fullName || 'Sinh viên KTX',
          code: r.user?.studentCode || 'N/A',
          room: r.preferredRoom?.roomNumber || 'Chưa xếp',
          date: new Date(r.createdAt).toLocaleDateString('vi-VN'),
          status: r.status,
        }));
        this.recentRegistrations.set(recentRegs);

        // Recent issues
        const recentMaint = (data.recentMaintenance || []).map((m) => ({
          room: `Phòng ${m.room?.roomNumber || 'KTX'}`,
          title: m.title,
          urgency: m.urgency,
          status: m.status,
          date: new Date(m.createdAt).toLocaleDateString('vi-VN'),
        }));
        this.recentIssues.set(recentMaint);

        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('[AdminDashboardComponent Error]', err);
        this.hasError.set(true);
        this.errorMessage.set('Không thể tải số liệu thống kê từ máy chủ API. Vui lòng kiểm tra dịch vụ backend.');
        this.isLoading.set(false);
      }
    });
  }
}
