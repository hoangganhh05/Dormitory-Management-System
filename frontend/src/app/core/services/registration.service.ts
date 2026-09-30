import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRegistrationDto, Registration, RegistrationApiResponse } from '../models/registration.model';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private apiUrl = `${environment.apiUrl}/registrations`;

  constructor(private http: HttpClient) {}

  getRegistrations(filters?: { status?: string; search?: string }): Observable<Registration[]> {
    let params = new HttpParams();
    if (filters?.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<RegistrationApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('[RegistrationService.getRegistrations Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể kết nối đến máy chủ lấy danh sách đơn đăng ký.'));
      })
    );
  }

  createRegistration(dto: CreateRegistrationDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      catchError((error) => {
        console.error('[RegistrationService.createRegistration Error]', error);
        return throwError(() => new Error(error.error?.message || 'Gửi đơn đăng ký thất bại. Vui lòng kiểm tra lại kết nối và dữ liệu.'));
      })
    );
  }

  approveRegistration(id: number, bedId?: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/approve`, { bedId }).pipe(
      catchError((error) => {
        console.error('[RegistrationService.approveRegistration Error]', error);
        return throwError(() => new Error(error.error?.message || 'Phê duyệt đơn đăng ký thất bại trên máy chủ.'));
      })
    );
  }

  rejectRegistration(id: number, rejectionReason: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/reject`, { rejectionReason }).pipe(
      catchError((error) => {
        console.error('[RegistrationService.rejectRegistration Error]', error);
        return throwError(() => new Error(error.error?.message || 'Từ chối đơn đăng ký thất bại trên máy chủ.'));
      })
    );
  }
}
