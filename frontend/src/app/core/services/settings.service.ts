import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DormitorySettings {
  [key: string]: string;
}

export interface PublicSettingsResponse {
  success: boolean;
  data: DormitorySettings;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/settings/public`;

  getPublicSettings(): Observable<PublicSettingsResponse> {
    return this.http.get<PublicSettingsResponse>(this.apiUrl).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('[SettingsService.getPublicSettings Error]', error);
        return of({
          success: false,
          message: 'Không thể tải cấu hình KTX.',
          data: {},
        });
      }),
    );
  }
}
