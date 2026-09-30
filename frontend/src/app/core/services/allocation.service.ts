import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AllocateBedDto,
  AllocationHistoryItem,
  AllocationStatsSummary,
  AvailableBedItem,
  CheckOutDto,
  TransferBedDto,
} from '../models/allocation.model';

@Injectable({
  providedIn: 'root',
})
export class AllocationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/allocations`;

  // 1. Thống kê phân bổ giường
  getAllocationStats(): Observable<AllocationStatsSummary> {
    return this.http
      .get<{ success: boolean; data: AllocationStatsSummary }>(`${this.apiUrl}/stats`)
      .pipe(
        map((res) => res.data),
        catchError((error) => {
          console.error('[AllocationService.getAllocationStats Error]', error);
          return throwError(
            () => new Error(error.error?.message || 'Không thể tải thống kê phân bổ.')
          );
        })
      );
  }

  // 2. Tra cứu lịch sử phân bổ và điều chuyển
  getAllocationHistory(filters?: {
    studentId?: number;
    actionType?: string;
    search?: string;
  }): Observable<AllocationHistoryItem[]> {
    let params = new HttpParams();
    if (filters?.studentId) {
      params = params.set('studentId', filters.studentId.toString());
    }
    if (filters?.actionType && filters.actionType !== 'ALL') {
      params = params.set('actionType', filters.actionType);
    }
    if (filters?.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http
      .get<{ success: boolean; data: AllocationHistoryItem[] }>(`${this.apiUrl}/history`, { params })
      .pipe(
        map((res) => res.data || []),
        catchError((error) => {
          console.error('[AllocationService.getAllocationHistory Error]', error);
          return throwError(
            () => new Error(error.error?.message || 'Không thể tải lịch sử điều chuyển lưu trú.')
          );
        })
      );
  }

  // 3. Lấy danh sách giường còn trống sẵn sàng tiếp nhận
  getAvailableBeds(filters?: { gender?: string; building?: string }): Observable<AvailableBedItem[]> {
    let params = new HttpParams();
    if (filters?.gender) {
      params = params.set('gender', filters.gender);
    }
    if (filters?.building && filters.building !== 'ALL') {
      params = params.set('building', filters.building);
    }

    return this.http
      .get<{ success: boolean; data: AvailableBedItem[] }>(`${this.apiUrl}/available-beds`, { params })
      .pipe(
        map((res) => res.data || []),
        catchError((error) => {
          console.error('[AllocationService.getAvailableBeds Error]', error);
          return throwError(
            () => new Error(error.error?.message || 'Không thể tải danh sách giường trống.')
          );
        })
      );
  }

  // 4. Phân giường mới cho sinh viên (Check-in)
  allocateBed(dto: AllocateBedDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/allocate`, dto).pipe(
      catchError((error) => {
        console.error('[AllocationService.allocateBed Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Phân bổ giường thất bại.')
        );
      })
    );
  }

  // 5. Điều chuyển phòng / giường (Transfer)
  transferBed(dto: TransferBedDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/transfer`, dto).pipe(
      catchError((error) => {
        console.error('[AllocationService.transferBed Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Điều chuyển giường thất bại.')
        );
      })
    );
  }

  // 6. Trả phòng / Kết thúc lưu trú (Check-out)
  checkOut(dto: CheckOutDto): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/checkout`, dto).pipe(
      catchError((error) => {
        console.error('[AllocationService.checkOut Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Thực hiện trả phòng thất bại.')
        );
      })
    );
  }
}
