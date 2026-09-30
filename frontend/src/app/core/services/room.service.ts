import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Room, RoomApiResponse } from '../models/room.model';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  private apiUrl = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) {}

  getRooms(filters?: { building?: string; status?: string; search?: string }): Observable<Room[]> {
    let params = new HttpParams();
    if (filters?.building && filters.building !== 'ALL') {
      params = params.set('building', filters.building);
    }
    if (filters?.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<RoomApiResponse>(this.apiUrl, { params }).pipe(
      map((response) => response.data || []),
      catchError((error) => {
        console.error('[RoomService.getRooms Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể kết nối đến máy chủ lấy danh sách phòng. Vui lòng kiểm tra kết nối mạng.'));
      })
    );
  }

  getRoomById(id: number): Observable<Room> {
    return this.http.get<{ success: boolean; data: Room }>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('[RoomService.getRoomById Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể tải thông tin chi tiết phòng từ máy chủ.'));
      })
    );
  }
}
