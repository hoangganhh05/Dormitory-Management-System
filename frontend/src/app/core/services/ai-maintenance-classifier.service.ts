import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';

export type MaintenanceSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface MaintenanceClassificationResult {
  severity: MaintenanceSeverity;
  category: string;
  aiReason: string;
  urgencyMapped: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable({
  providedIn: 'root',
})
export class AiMaintenanceClassifierService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl
    ? `${environment.apiUrl}/ai/classify-maintenance`
    : '/api/ai/classify-maintenance';

  /**
   * Gọi API Backend phân loại sự cố thông minh qua Google Gemini / Backend NLP Engine
   */
  classifyRequestRemote(title: string, description: string): Observable<MaintenanceClassificationResult> {
    const trimmedTitle = title?.trim() || '';
    const trimmedDesc = description?.trim() || '';
    if (!trimmedTitle && !trimmedDesc) {
      return of({
        severity: 'MEDIUM',
        category: 'Điện & Quạt',
        aiReason: 'Chưa có đủ thông tin mô tả chi tiết',
        urgencyMapped: 'MEDIUM',
      });
    }

    return this.http
      .post<{
        success: boolean;
        severity?: MaintenanceSeverity;
        category?: string;
        reason?: string;
        urgency?: 'HIGH' | 'MEDIUM' | 'LOW';
        data?: any;
      }>(this.apiUrl, { title: trimmedTitle, description: trimmedDesc })
      .pipe(
        timeout(4000),
        map((res) => {
          const sev: MaintenanceSeverity = res.severity || res.data?.severity || 'MEDIUM';
          const urg: 'HIGH' | 'MEDIUM' | 'LOW' =
            res.urgency ||
            res.data?.urgency ||
            (sev === 'CRITICAL' || sev === 'HIGH' ? 'HIGH' : sev === 'LOW' ? 'LOW' : 'MEDIUM');
          const cat = res.category || res.data?.category || 'Điện & Quạt';
          const rsn = res.reason || res.data?.reason || 'Phát hiện theo mô tả hiện trường sự cố';

          return {
            severity: sev,
            category: cat,
            aiReason: rsn,
            urgencyMapped: urg,
          };
        }),
        catchError(() => of(this.classifyRequest(title, description)))
      );
  }

  /**
   * Phân tích nội dung tiêu đề và mô tả sự cố tức thì (Client-side Rule Engine 0ms)
   * 1. Mức độ nghiêm trọng (severity: CRITICAL, HIGH, MEDIUM, LOW)
   * 2. Phân loại danh mục cơ sở vật chất (category)
   * 3. Lý do suy luận AI (aiReason)
   */
  classifyRequest(title: string, description: string): MaintenanceClassificationResult {
    const combined = `${title || ''} ${description || ''}`.toLowerCase().trim();

    if (!combined) {
      return {
        severity: 'MEDIUM',
        category: 'Điện & Quạt',
        aiReason: 'Chưa có đủ thông tin mô tả chi tiết',
        urgencyMapped: 'MEDIUM',
      };
    }

    // 1. NHÓM NGUY HIỂM / KHẨN CẤP (CRITICAL)
    // Nguy cơ chập cháy điện, rò điện, nổ bình nóng lạnh, ngập nước vỡ ống chính
    const criticalKeywords = [
      'chập điện',
      'rò điện',
      'hở điện',
      'giật điện',
      'bị giật',
      'cháy',
      'nổ bình nóng lạnh',
      'nổ',
      'bốc khói',
      'mùi khét',
      'khét lẹt',
      'vỡ đường ống nước chính',
      'vỡ ống chính',
      'bể ống nước chính',
      'bể ống',
      'ngập nước cả phòng',
      'ngập nước',
      'hở dây điện',
      'chập cháy',
      'phát tia lửa',
    ];

    if (this.containsAny(combined, criticalKeywords)) {
      let category = 'Điện & Quạt';
      let reason = 'Phát hiện nguy cơ chập cháy/rò điện nguy hiểm, cần can thiệp khẩn cấp';

      if (combined.includes('nước') || combined.includes('ống') || combined.includes('ngập')) {
        category = 'Cấp thoát nước';
        reason = 'Phát hiện nguy cơ vỡ đường ống nước chính hoặc ngập nước phòng';
      }

      return {
        severity: 'CRITICAL',
        category,
        aiReason: reason,
        urgencyMapped: 'HIGH',
      };
    }

    // 2. NHÓM CAO (HIGH)
    // Mất điện toàn phòng, mất nước, hỏng khóa cửa phòng
    const highKeywords = [
      'mất điện toàn phòng',
      'mất điện',
      'mất nước sinh hoạt',
      'mất nước',
      'hết nước',
      'hỏng khóa cửa chính',
      'hỏng khóa cửa phòng',
      'hỏng khóa',
      'kẹt khóa không vào được',
      'kẹt khóa',
      'không vào được phòng',
      'vỡ kính cửa sổ',
      'vỡ kính',
      'không khóa được cửa',
      'rơi cánh cửa',
      'rò rỉ nước lớn',
      'tràn nước',
    ];

    if (this.containsAny(combined, highKeywords)) {
      let category = 'Cửa & Khóa';
      if (combined.includes('điện')) category = 'Điện & Quạt';
      else if (combined.includes('nước')) category = 'Cấp thoát nước';

      return {
        severity: 'HIGH',
        category,
        aiReason: 'Sự cố ảnh hưởng trực tiếp đến an ninh, lưu trú và sinh hoạt thiết yếu',
        urgencyMapped: 'HIGH',
      };
    }

    // 3. NHÓM TRUNG BÌNH (MEDIUM)
    // Quạt trần rung lắc, bóng đèn nhấp nháy, điều hòa không mát, tắc bồn rửa
    const mediumKeywords = [
      'quạt trần rung lắc',
      'rung lắc',
      'bóng đèn nhấp nháy',
      'nhấp nháy',
      'điều hòa không mát',
      'không mát',
      'tắc bồn rửa',
      'tắc bồn',
      'bóng đèn',
      'đèn tuýp',
      'đèn bàn',
      'quạt trần kêu to',
      'quạt trần',
      'quạt kêu',
      'quạt không quay',
      'điều hòa',
      'máy lạnh',
      'bình nóng lạnh không ấm',
      'bình nóng lạnh',
      'bình nước nóng',
      'tắc lavabo',
      'tắc cống',
      'thoát nước chậm',
      'rò rỉ vòi nước',
      'hỏng vòi',
      'vòi xịt',
      'vòi sen',
    ];

    if (this.containsAny(combined, mediumKeywords)) {
      let category = 'Điện & Quạt';
      if (
        combined.includes('nước') ||
        combined.includes('vòi') ||
        combined.includes('tắc') ||
        combined.includes('cống') ||
        combined.includes('bồn')
      ) {
        category = 'Cấp thoát nước';
      }

      return {
        severity: 'MEDIUM',
        category,
        aiReason: 'Thiết bị tiện nghi phòng ở hoạt động kém, cần bảo dưỡng định kỳ',
        urgencyMapped: 'MEDIUM',
      };
    }

    // 4. NHÓM THẤP (LOW)
    // Hỏng bản lề tủ, hỏng ngăn kéo, đứt dây phơi
    const lowKeywords = [
      'hỏng bản lề tủ',
      'bản lề tủ',
      'bản lề',
      'hỏng ngăn kéo',
      'kẹt ngăn kéo',
      'ngăn kéo',
      'đứt dây phơi',
      'dây phơi',
      'tróc sơn bàn',
      'tróc sơn',
      'sơn tường',
      'kêu bản lề tủ',
      'lỏng ốc',
      'kêu cọt kẹt',
      'bàn học',
      'ghế',
      'giường tầng',
      'rách lưới',
      'móc treo',
    ];

    if (this.containsAny(combined, lowKeywords)) {
      let category = 'Giường tủ';
      if (combined.includes('cửa') || combined.includes('khóa')) category = 'Cửa & Khóa';

      return {
        severity: 'LOW',
        category,
        aiReason: 'Hao mòn trang thiết bị phụ trợ hoặc thẩm mỹ, xử lý theo kế hoạch thường kỳ',
        urgencyMapped: 'LOW',
      };
    }

    // Fallback phân loại
    let inferredCategory = 'Điện & Quạt';
    if (this.containsAny(combined, ['nước', 'vòi', 'lavabo', 'bồn', 'cống', 'thoát'])) {
      inferredCategory = 'Cấp thoát nước';
    } else if (this.containsAny(combined, ['cửa', 'khóa', 'chìa', 'bản lề', 'kính'])) {
      inferredCategory = 'Cửa & Khóa';
    } else if (this.containsAny(combined, ['giường', 'tủ', 'bàn', 'ghế', 'chiếu'])) {
      inferredCategory = 'Giường tủ';
    } else {
      inferredCategory = 'Khác';
    }

    return {
      severity: 'MEDIUM',
      category: inferredCategory,
      aiReason: 'Hệ thống tự động phân loại theo thiết bị tiện ích nội trú',
      urgencyMapped: 'MEDIUM',
    };
  }

  private containsAny(source: string, keywords: string[]): boolean {
    return keywords.some((kw) => source.includes(kw));
  }
}
