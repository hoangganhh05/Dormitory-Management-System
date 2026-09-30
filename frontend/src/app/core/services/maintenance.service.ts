import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateMaintenanceDto, MaintenanceApiResponse, MaintenanceRequest } from '../models/maintenance.model';

@Injectable({
  providedIn: 'root',
})
export class MaintenanceService {
  private apiUrl = `${environment.apiUrl}/maintenance`;

  constructor(private http: HttpClient) {}

  getRequests(status?: string): Observable<MaintenanceRequest[]> {
    let params = new HttpParams();
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<MaintenanceApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('[MaintenanceService.getRequests Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể kết nối đến máy chủ lấy danh sách báo hỏng.'));
      })
    );
  }

  createRequest(dto: CreateMaintenanceDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      catchError((error) => {
        console.error('[MaintenanceService.createRequest Error]', error);
        return throwError(() => new Error(error.error?.message || 'Gửi yêu cầu báo hỏng thất bại. Vui lòng thử lại.'));
      })
    );
  }

  updateStatus(id: number, status: string, adminFeedback?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status, adminFeedback }).pipe(
      catchError((error) => {
        console.error('[MaintenanceService.updateStatus Error]', error);
        return throwError(() => new Error(error.error?.message || 'Cập nhật trạng thái sự cố thất bại trên máy chủ.'));
      })
    );
  }
}
