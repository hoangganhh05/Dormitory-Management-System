import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRoomDto,
  Room,
  RoomApiResponse,
  RoomStatsSummary,
  UpdateRoomDto,
  Bed,
} from '../models/room.model';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/rooms`;

  // 1. Lấy danh sách phòng có kèm giường và bộ lọc
  getRooms(filters?: {
    building?: string;
    status?: string;
    roomType?: string;
    search?: string;
  }): Observable<Room[]> {
    let params = new HttpParams();
    if (filters?.building && filters.building !== 'ALL') {
      params = params.set('building', filters.building);
    }
    if (filters?.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    if (filters?.roomType && filters.roomType !== 'ALL') {
      params = params.set('roomType', filters.roomType);
    }
    if (filters?.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<RoomApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('[RoomService.getRooms Error]', error);
        return throwError(
          () =>
            new Error(
              error.error?.message ||
                'Không thể kết nối đến máy chủ lấy danh sách phòng.'
            )
        );
      })
    );
  }

  // 2. Lấy chi tiết phòng theo ID
  getRoomById(id: number): Observable<Room> {
    return this.http.get<{ success: boolean; data: Room }>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('[RoomService.getRoomById Error]', error);
        return throwError(
          () =>
            new Error(
              error.error?.message || 'Không thể tải thông tin chi tiết phòng.'
            )
        );
      })
    );
  }

  // 3. Thống kê tổng hợp sức chứa và phòng
  getRoomStats(): Observable<RoomStatsSummary> {
    return this.http
      .get<{ success: boolean; data: RoomStatsSummary }>(
        `${this.apiUrl}/stats/summary`
      )
      .pipe(
        map((res) => res.data),
        catchError((error) => {
          console.error('[RoomService.getRoomStats Error]', error);
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  'Không thể tải thống kê sức chứa phòng.'
              )
          );
        })
      );
  }

  // 4. [ADMIN] Tạo mới phòng
  createRoom(dto: CreateRoomDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      catchError((error) => {
        console.error('[RoomService.createRoom Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Lỗi khi tạo phòng mới.')
        );
      })
    );
  }

  // 5. [ADMIN] Cập nhật phòng
  updateRoom(id: number, dto: UpdateRoomDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      catchError((error) => {
        console.error('[RoomService.updateRoom Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Lỗi khi cập nhật phòng.')
        );
      })
    );
  }

  // 6. [ADMIN] Xóa phòng
  deleteRoom(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('[RoomService.deleteRoom Error]', error);
        return throwError(
          () => new Error(error.error?.message || 'Lỗi khi xóa phòng.')
        );
      })
    );
  }

  // 7. [ADMIN] Cập nhật trạng thái giường
  updateBedStatus(
    roomId: number,
    bedId: number,
    status: 'VACANT' | 'OCCUPIED' | 'RESERVED'
  ): Observable<Bed> {
    return this.http
      .put<{ success: boolean; data: Bed }>(
        `${this.apiUrl}/${roomId}/beds/${bedId}`,
        { status }
      )
      .pipe(
        map((res) => res.data),
        catchError((error) => {
          console.error('[RoomService.updateBedStatus Error]', error);
          return throwError(
            () =>
              new Error(
                error.error?.message || 'Lỗi khi cập nhật trạng thái giường.'
              )
          );
        })
      );
  }
}
