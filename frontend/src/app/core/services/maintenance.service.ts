import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError, timeout } from 'rxjs';
import {
  CreateMaintenanceDto,
  MaintenanceApiResponse,
  MaintenanceRequest,
  MaintenanceStats,
  MaintenanceQueryParams,
  MaintenanceStatus,
} from '../models/maintenance.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/maintenance`;

  /**
   * Thống kê tổng hợp số liệu bảo trì
   */
  getMaintenanceStats(): Observable<MaintenanceApiResponse<MaintenanceStats>> {
    return this.http.get<MaintenanceApiResponse<MaintenanceStats>>(`${this.apiUrl}/stats`).pipe(
      timeout(15000),
      catchError((err) => {
        console.error('[MaintenanceService] getMaintenanceStats failed:', err);
        return of({
          success: false,
          message: 'Không thể tải thống kê bảo trì',
          data: {
            total: 0,
            pending: 0,
            processing: 0,
            resolved: 0,
            rejected: 0,
            highUrgency: 0,
          },
        });
      }),
    );
  }

  /**
   * Lấy danh sách toàn bộ yêu cầu (Admin) hỗ trợ lọc & tìm kiếm & phân trang
   */
  getRequests(params?: MaintenanceQueryParams): Observable<MaintenanceApiResponse<MaintenanceRequest[]>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.status && params.status !== 'ALL') httpParams = httpParams.set('status', params.status);
      if (params.urgency && params.urgency !== 'ALL') httpParams = httpParams.set('urgency', params.urgency);
      if (params.building && params.building !== 'ALL') httpParams = httpParams.set('building', params.building);
      if (params.search) httpParams = httpParams.set('search', params.search.trim());
      if (params.page) httpParams = httpParams.set('page', String(params.page));
      if (params.limit) httpParams = httpParams.set('limit', String(params.limit));
    }
    return this.http.get<MaintenanceApiResponse<MaintenanceRequest[]>>(this.apiUrl, { params: httpParams }).pipe(
      timeout(15000),
      catchError((err) => {
        console.error('[MaintenanceService] getRequests failed:', err);
        return of({
          success: false,
          message: 'Không thể tải danh sách yêu cầu bảo trì.',
          data: [] as MaintenanceRequest[],
          pagination: {
            total: 0,
            page: params?.page || 1,
            limit: params?.limit || 10,
            totalPages: 1,
          },
        });
      }),
    );
  }

  /**
   * Lấy lịch sử yêu cầu của sinh viên đăng nhập
   */
  getMyRequests(): Observable<MaintenanceApiResponse<MaintenanceRequest[]>> {
    return this.http.get<MaintenanceApiResponse<MaintenanceRequest[]>>(`${this.apiUrl}/my`).pipe(
      timeout(15000),
      catchError((err) => {
        console.error('[MaintenanceService] getMyRequests failed:', err);
        return of({
          success: false,
          message: 'Không thể tải lịch sử báo hỏng.',
          data: [] as MaintenanceRequest[],
        });
      }),
    );
  }

  /**
   * Xem chi tiết yêu cầu
   */
  getRequestById(id: number): Observable<MaintenanceApiResponse<MaintenanceRequest>> {
    return this.http.get<MaintenanceApiResponse<MaintenanceRequest>>(`${this.apiUrl}/${id}`).pipe(
      timeout(15000),
      catchError((err) => {
        console.error(`[MaintenanceService] getRequestById(${id}) failed:`, err);
        return of({
          success: false,
          message: 'Không thể tải thông tin chi tiết sự cố.',
          data: null as any,
        });
      }),
    );
  }

  /**
   * Gửi yêu cầu sửa chữa mới
   */
  createRequest(dto: CreateMaintenanceDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto);
  }

  /**
   * Cập nhật trạng thái xử lý & phản hồi kỹ thuật
   */
  updateStatus(id: number, status: MaintenanceStatus, adminFeedback?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status, adminFeedback });
  }

  /**
   * Xóa yêu cầu sửa chữa
   */
  deleteRequest(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
