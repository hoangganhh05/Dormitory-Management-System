import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardApiResponse, DashboardStats } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardApiResponse>(`${this.apiUrl}/stats`).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('[DashboardService.getStats Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể kết nối đến máy chủ lấy số liệu thống kê.'));
      })
    );
  }
}
