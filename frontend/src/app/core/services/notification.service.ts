import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { getApiErrorMessage } from '../utils/api-error.util';
import {
  NotificationItem,
  NotificationStats,
  NotificationQueryParams,
  CreateNotificationDto,
  UpdateNotificationDto,
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
        console.warn('Không thể tải dữ liệu thông báo từ backend:', err);
        return of({
          success: false,
          message: 'Không thể tải danh sách thông báo hoặc hệ thống đang bảo trì.',
          data: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
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
    return this.http.post<ApiResponse<NotificationItem>>(this.apiUrl, dto).pipe(
      timeout(30000),
      catchError((error) => {
        console.error('[NotificationService.createNotification] failed:', error);
        return throwError(() => new Error(getApiErrorMessage(error, 'Không thể đăng thông báo.')));
      }),
    );
  }

  /**
   * [Admin] Cập nhật thông báo
   */
  updateNotification(id: number, dto: UpdateNotificationDto): Observable<ApiResponse<NotificationItem>> {
    return this.http.put<ApiResponse<NotificationItem>>(`${this.apiUrl}/${id}`, dto).pipe(
      timeout(30000),
      catchError((error) => {
        console.error('[NotificationService.updateNotification] failed:', error);
        return throwError(() => new Error(getApiErrorMessage(error, 'Không thể cập nhật thông báo.')));
      }),
    );
  }

  /**
   * [Admin] Bật/tắt ghim thông báo
   */
  togglePin(id: number): Observable<ApiResponse<NotificationItem>> {
    return this.http.patch<ApiResponse<NotificationItem>>(`${this.apiUrl}/${id}/pin`, {}).pipe(
      timeout(30000),
      catchError((error) => {
        console.error('[NotificationService.togglePin] failed:', error);
        return throwError(() => new Error(getApiErrorMessage(error, 'Không thể thay đổi trạng thái ghim.')));
      }),
    );
  }

  /**
   * [Admin] Xóa thông báo
   */
  deleteNotification(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`).pipe(
      timeout(30000),
      catchError((error) => {
        console.error('[NotificationService.deleteNotification] failed:', error);
        return throwError(() => new Error(getApiErrorMessage(error, 'Không thể xóa thông báo.')));
      }),
    );
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
