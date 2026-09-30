import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRegistrationDto,
  Registration,
  RegistrationApiResponse,
  RegistrationStatsSummary,
} from '../models/registration.model';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/registrations`;

  // 1. Thống kê tổng hợp đơn đăng ký
  getRegistrationStats(): Observable<RegistrationStatsSummary> {
    return this.http
      .get<{ success: boolean; data: RegistrationStatsSummary }>(
        `${this.apiUrl}/stats/summary`
      )
      .pipe(
        map((res) => res.data),
        catchError((error) => {
          console.error('[RegistrationService.getRegistrationStats Error]', error);
          return throwError(
            () => new Error(error.error?.message || 'Không thể tải thống kê đơn đăng ký.')
          );
        })
      );
  }

  // 2. Lấy danh sách toàn bộ đơn đăng ký (Admin)
  getRegistrations(filters?: {
    status?: string;
    semester?: string;
    search?: string;
  }): Observable<Registration[]> {
    let params = new HttpParams();
    if (filters?.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    if (filters?.semester && filters.semester !== 'ALL') {
      params = params.set('semester', filters.semester);
    }
    if (filters?.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<RegistrationApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('[RegistrationService.getRegistrations Error]', error);
        return throwError(
          () =>
            new Error(
              error.error?.message || 'Không thể kết nối đến máy chủ lấy danh sách đơn đăng ký.'
            )
        );
      })
    );
  }

  // 3. Lấy chi tiết một đơn đăng ký
  getRegistrationById(id: number): Observable<Registration> {
    return this.http.get<{ success: boolean; data: Registration }>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data),
      catchError((error) => {
        console.error('[RegistrationService.getRegistrationById Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Không thể tải chi tiết đơn đăng ký.')
        );
      })
    );
  }

  // 4. [CLIENT] Lấy danh sách đơn đăng ký của chính mình
  getMyRegistrations(): Observable<Registration[]> {
    return this.http.get<{ success: boolean; data: Registration[] }>(`${this.apiUrl}/my`).pipe(
      map((res) => res.data || []),
      catchError((error) => {
        console.error('[RegistrationService.getMyRegistrations Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Không thể tải lịch sử đơn đăng ký của bạn.')
        );
      })
    );
  }

  // 5. [CLIENT] Tạo mới đơn đăng ký
  createRegistration(dto: CreateRegistrationDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      catchError((error) => {
        console.error('[RegistrationService.createRegistration Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Gửi đơn đăng ký thất bại.')
        );
      })
    );
  }

  // 6. [ADMIN] Phê duyệt đơn đăng ký & phân bổ giường
  approveRegistration(id: number, bedId?: number | null): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/approve`, { bedId }).pipe(
      catchError((error) => {
        console.error('[RegistrationService.approveRegistration Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Phê duyệt đơn đăng ký thất bại.')
        );
      })
    );
  }

  // 7. [ADMIN] Từ chối đơn đăng ký
  rejectRegistration(id: number, rejectionReason: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/reject`, { rejectionReason }).pipe(
      catchError((error) => {
        console.error('[RegistrationService.rejectRegistration Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Từ chối đơn đăng ký thất bại.')
        );
      })
    );
  }

  // 8. [CLIENT] Tự hủy đơn đăng ký khi đang PENDING
  cancelMyRegistration(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/cancel`, {}).pipe(
      catchError((error) => {
        console.error('[RegistrationService.cancelMyRegistration Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Hủy đơn đăng ký thất bại.')
        );
      })
    );
  }
}
