import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateStudentDto, StudentApiResponse, StudentProfile, UpdateStudentDto } from '../models/student.model';
import { getApiErrorMessage } from '../utils/api-error.util';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/students`;

  // [ADMIN] Lấy toàn bộ danh sách hồ sơ sinh viên
  getAllStudents(filters?: { search?: string; gender?: string; status?: string }): Observable<StudentProfile[]> {
    let params = new HttpParams();
    if (filters?.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }
    if (filters?.gender && filters.gender !== 'ALL') {
      params = params.set('gender', filters.gender);
    }
    if (filters?.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }

    return this.http.get<StudentApiResponse>(this.apiUrl, { params }).pipe(
      map((res) => res.data || []),
      catchError((error) => {
        console.error('[StudentService.getAllStudents Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể tải danh sách hồ sơ sinh viên từ máy chủ.'));
      })
    );
  }

  // [ADMIN] Lấy chi tiết một sinh viên theo ID
  getStudentById(id: number): Observable<StudentProfile> {
    return this.http.get<{ success: boolean; data: StudentProfile }>(`${this.apiUrl}/${id}`).pipe(
      map((res) => res.data),
      catchError((error) => {
        console.error('[StudentService.getStudentById Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể tải chi tiết hồ sơ sinh viên.'));
      })
    );
  }

  // [ADMIN] Tạo mới một hồ sơ sinh viên
  createStudent(dto: CreateStudentDto): Observable<any> {
    return this.http.post<any>(this.apiUrl, dto).pipe(
      timeout(30000),
      catchError((error) => {
        console.error('[StudentService.createStudent Error]', error);
        return throwError(() => new Error(getApiErrorMessage(error, 'Lỗi khi tạo mới hồ sơ sinh viên.')));
      })
    );
  }

  // [ADMIN] Cập nhật hồ sơ sinh viên
  updateStudent(id: number, dto: UpdateStudentDto): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, dto).pipe(
      timeout(30000),
      catchError((error) => {
        console.error('[StudentService.updateStudent Error]', error);
        return throwError(() => new Error(getApiErrorMessage(error, 'Lỗi khi cập nhật hồ sơ sinh viên.')));
      })
    );
  }

  // [CLIENT] Sinh viên xem hồ sơ của chính mình
  getMyProfile(): Observable<StudentProfile> {
    return this.http.get<{ success: boolean; data: StudentProfile }>(`${this.apiUrl}/me/profile`).pipe(
      map((res) => res.data),
      catchError((error) => {
        console.error('[StudentService.getMyProfile Error]', error);
        return throwError(() => new Error(error.error?.message || 'Không thể tải thông tin hồ sơ cá nhân.'));
      })
    );
  }

  // [CLIENT] Sinh viên cập nhật số điện thoại cá nhân
  updateMyPhone(phone: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/me/profile`, { phone }).pipe(
      catchError((error) => {
        console.error('[StudentService.updateMyPhone Error]', error);
        return throwError(() => new Error(error.error?.message || 'Lỗi khi cập nhật số điện thoại.'));
      })
    );
  }

  // [CLIENT] Sinh viên cập nhật ảnh đại diện của chính mình
  updateMyAvatar(avatar: string): Observable<{ success: boolean; avatar: string; message: string }> {
    return this.http.post<{ success: boolean; avatar: string; message: string }>(`${this.apiUrl}/avatar`, { avatar }).pipe(
      timeout(30000),
      catchError((error) => {
        console.error('[StudentService.updateMyAvatar Error]', error);
        return throwError(() => new Error(getApiErrorMessage(error, 'Lỗi khi cập nhật ảnh đại diện.')));
      })
    );
  }
}
