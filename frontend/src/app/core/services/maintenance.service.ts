import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateMaintenanceDto,
  MaintenanceApiResponse,
  MaintenanceRequest,
  MaintenanceStats,
  MaintenanceQueryParams,
  MaintenanceStatus,
} from '../models/maintenance.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api/maintenance';

  /**
   * Thống kê tổng hợp số liệu bảo trì
   */
  getMaintenanceStats(): Observable<MaintenanceApiResponse<MaintenanceStats>> {
    return this.http.get<MaintenanceApiResponse<MaintenanceStats>>(`${this.apiUrl}/stats`);
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
    return this.http.get<MaintenanceApiResponse<MaintenanceRequest[]>>(this.apiUrl, { params: httpParams });
  }

  /**
   * Lấy lịch sử yêu cầu của sinh viên đăng nhập
   */
  getMyRequests(): Observable<MaintenanceApiResponse<MaintenanceRequest[]>> {
    return this.http.get<MaintenanceApiResponse<MaintenanceRequest[]>>(`${this.apiUrl}/my`);
  }

  /**
   * Xem chi tiết yêu cầu
   */
  getRequestById(id: number): Observable<MaintenanceApiResponse<MaintenanceRequest>> {
    return this.http.get<MaintenanceApiResponse<MaintenanceRequest>>(`${this.apiUrl}/${id}`);
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
