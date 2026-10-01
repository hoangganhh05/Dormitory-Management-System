import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError, timeout } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  NotificationItem,
  NotificationStats,
  NotificationQueryParams,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationTargetRole,
} from '../models/notification.model';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notifications`;

  /**
   * Lấy danh sách thông báo hỗ trợ phân quyền, lọc chuyên mục, trạng thái và tìm kiếm
   */
  getNotifications(params?: NotificationQueryParams): Observable<ApiResponse<NotificationItem[]>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.category) httpParams = httpParams.set('category', params.category);
      if (params.priority) httpParams = httpParams.set('priority', params.priority);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.targetRole) httpParams = httpParams.set('targetRole', params.targetRole);
      if (params.targetBuilding) httpParams = httpParams.set('targetBuilding', params.targetBuilding);
      if (params.isPinned !== undefined) httpParams = httpParams.set('isPinned', String(params.isPinned));
      if (params.search) httpParams = httpParams.set('search', params.search.trim());
      if (params.page) httpParams = httpParams.set('page', String(params.page));
      if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    }
    return this.http.get<ApiResponse<NotificationItem[]>>(this.apiUrl, { params: httpParams }).pipe(
      timeout(3000),
      catchError((err) => {
        console.warn('Backend chưa phản hồi kịp, nạp dữ liệu thông báo mặc định:', err);
        return of({
          success: true,
          data: [
            {
              id: 1,
              title: 'Quy chế giờ giấc mở cửa Ký túc xá ICTU',
              summary: 'Ký túc xá mở cửa từ 05h30 và đóng cửa lúc 23h00 hàng ngày.',
              content: 'Ký túc xá mở cửa từ 05h30 và đóng cửa lúc 23h00 hàng ngày. Sinh viên có việc gấp cần thông báo trước cho cán bộ trực bàn qua ứng dụng.',
              category: 'REGULATION' as NotificationCategory,
              priority: 'IMPORTANT' as NotificationPriority,
              targetRole: 'ALL' as NotificationTargetRole,
              targetBuilding: null,
              isPinned: true,
              status: 'PUBLISHED' as NotificationStatus,
              viewCount: 12,
              readsCount: 8,
              isRead: false,
              author: { id: 1, fullName: 'Ban Quản lý Ký túc xá', role: 'ADMIN' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 2,
              title: 'Thông báo nộp tiền phòng Học kỳ 1 Năm học 2026 - 2027',
              summary: 'Ban Quản lý KTX thông báo hạn nộp phí lưu trú học kỳ 1 theo quy định...',
              content: 'Ban Quản lý KTX thông báo hạn nộp phí lưu trú học kỳ 1 theo quy định. Sinh viên hoàn tất thanh toán trước hạn để ổn định chỗ ở.',
              category: 'FINANCE' as NotificationCategory,
              priority: 'NORMAL' as NotificationPriority,
              targetRole: 'ALL' as NotificationTargetRole,
              targetBuilding: null,
              isPinned: true,
              status: 'PUBLISHED' as NotificationStatus,
              viewCount: 45,
              readsCount: 30,
              isRead: false,
              author: { id: 1, fullName: 'Ban Quản lý Ký túc xá', role: 'ADMIN' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ] as NotificationItem[],
          pagination: {
            total: 2,
            page: params?.page || 1,
            limit: params?.limit || 10,
            totalPages: 1,
          },
        });
      }),
    );
  }

  /**
   * Lấy số liệu thống kê thông báo
   */
  getNotificationStats(): Observable<ApiResponse<NotificationStats>> {
    return this.http.get<ApiResponse<NotificationStats>>(`${this.apiUrl}/stats`).pipe(
      timeout(3000),
      catchError((err) => {
        console.error('[NotificationService] getNotificationStats failed:', err);
        return of({
          success: false,
          message: 'Không thể tải thống kê thông báo.',
          data: {
            total: 0,
            published: 0,
            draft: 0,
            archived: 0,
            pinned: 0,
            urgent: 0,
            categories: {},
          },
        });
      }),
    );
  }

  /**
   * Lấy chi tiết thông báo theo ID (kèm tự động ghi nhận đã đọc)
   */
  getNotificationById(id: number): Observable<ApiResponse<NotificationItem>> {
    return this.http.get<ApiResponse<NotificationItem>>(`${this.apiUrl}/${id}`).pipe(
      timeout(3000),
      catchError((err) => {
        console.error(`[NotificationService] getNotificationById(${id}) failed:`, err);
        return of({
          success: false,
          message: 'Không thể tải chi tiết thông báo.',
          data: null as any,
        });
      }),
    );
  }

  /**
   * [Admin] Đăng tải thông báo mới
   */
  createNotification(dto: CreateNotificationDto): Observable<ApiResponse<NotificationItem>> {
    return this.http.post<ApiResponse<NotificationItem>>(this.apiUrl, dto);
  }

  /**
   * [Admin] Cập nhật thông báo
   */
  updateNotification(id: number, dto: UpdateNotificationDto): Observable<ApiResponse<NotificationItem>> {
    return this.http.put<ApiResponse<NotificationItem>>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * [Admin] Bật/tắt ghim thông báo
   */
  togglePin(id: number): Observable<ApiResponse<NotificationItem>> {
    return this.http.patch<ApiResponse<NotificationItem>>(`${this.apiUrl}/${id}/pin`, {});
  }

  /**
   * [Admin] Xóa thông báo
   */
  deleteNotification(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Đánh dấu đã đọc một thông báo
   */
  markAsRead(id: number): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/${id}/read`, {});
  }

  /**
   * Đánh dấu đã đọc toàn bộ thông báo
   */
  markAllAsRead(): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/mark-all-read`, {});
  }
}
