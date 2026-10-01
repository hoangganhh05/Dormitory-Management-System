import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, timeout, finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id?: number;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  actionUrl?: string;
  actionLabel?: string;
}

export interface ChatApiResponse {
  success: boolean;
  reply?: string;
  message?: string;
  data?: {
    answer: string;
    source: string;
    modelUsed: string;
    isAiGenerated: boolean;
    timestamp: string;
  };
}

export function cleanMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bỏ in đậm **text** -> text
    .replace(/^\s*\*\s+/gm, '- ')      // Đổi * đầu dòng thành -
    .replace(/\*(.*?)\*/g, '$1')     // Bỏ in nghiêng *text* -> text
    .replace(/\*/g, '');             // Bỏ dấu hoa thị còn sót
}

@Injectable({
  providedIn: 'root',
})
export class AiAssistantService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl ? `${environment.apiUrl}/ai/chat` : '/api/ai/chat';

  readonly isOpen = signal<boolean>(false);
  readonly isTyping = signal<boolean>(false);

  readonly messages = signal<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Xin chào! Mình là Trợ lý AI Ban Quản lý KTX ICTU 🤖. Mình có thể hỗ trợ bạn giải đáp thắc mắc về phòng ở, biểu phí, nội quy và tiếp nhận thông tin báo hỏng thiết bị 24/7.',
      time: this.formatCurrentTime(),
    },
  ]);

  toggleChat(): void {
    this.isOpen.update((v) => !v);
  }

  openChat(): void {
    this.isOpen.set(true);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  /**
   * Gọi API Backend Gemini Chat endpoint
   */
  chat(message: string, history?: Array<{ role: string; content: string }>): Observable<ChatApiResponse> {
    return this.http.post<ChatApiResponse>(this.apiUrl, {
      message,
      history,
    });
  }

  /**
   * Gửi câu hỏi của người dùng và cập nhật hội thoại thời gian thực qua Backend Gemini
   */
  sendMessage(query: string): void {
    const trimmed = query.trim();
    if (!trimmed || this.isTyping()) {
      return;
    }

    const currentTime = this.formatCurrentTime();

    // 1. Thêm tin nhắn của User vào danh sách hiển thị
    this.messages.update((list) => [
      ...list,
      {
        sender: 'user',
        text: trimmed,
        time: currentTime,
      },
    ]);

    // 2. Bật trạng thái đang gõ
    this.isTyping.set(true);

    // 3. Chuẩn bị ngữ cảnh hội thoại gần nhất (Multi-turn chat context)
    // Chỉ lấy các tin nhắn trước đó (bỏ qua tin nhắn chào ban đầu của bot và tin nhắn hiện tại)
    const prevMessages = this.messages().slice(0, -1);
    const firstUserIdx = prevMessages.findIndex((m) => m.sender === 'user');
    const validHistoryMessages = firstUserIdx !== -1 ? prevMessages.slice(firstUserIdx).slice(-6) : [];

    const history = validHistoryMessages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'model',
      content: m.text,
    }));

    // 4. Gửi HTTP POST tới Backend Gemini API
    this.chat(trimmed, history)
      .pipe(
        timeout(25000),
        catchError((error) => {
          console.error('[AiAssistantService] Lỗi kết nối máy chủ AI Gemini:', error);
          return of({
            success: false,
            reply: 'Hiện tại không thể kết nối tới máy chủ AI, vui lòng thử lại sau.',
          } as ChatApiResponse);
        }),
        finalize(() => {
          this.isTyping.set(false);
        })
      )
      .subscribe((res) => {
        const rawReply =
          res?.reply ||
          res?.data?.answer ||
          (res?.success ? 'Yêu cầu đã được tiếp nhận.' : 'Hiện tại không thể kết nối tới máy chủ AI, vui lòng thử lại sau.');

        const replyText = cleanMarkdown(rawReply);
        const action = this.resolveAction(replyText);

        this.messages.update((list) => [
          ...list,
          {
            sender: 'bot',
            text: replyText,
            time: this.formatCurrentTime(),
            actionUrl: action?.url,
            actionLabel: action?.label,
          },
        ]);
      });
  }

  /**
   * Tự động nhận diện đường dẫn điều hướng nhanh dựa trên nội dung câu trả lời của AI
   */
  private resolveAction(reply: string): { url: string; label: string } | null {
    const lower = (reply || '').toLowerCase();
    if (lower.includes('đăng ký lưu trú') || lower.includes('đăng ký phòng') || lower.includes('nộp đơn')) {
      return { url: '/client/register-room', label: 'Đi tới Đăng ký lưu trú' };
    }
    if (lower.includes('báo hỏng') || lower.includes('sửa chữa') || lower.includes('phiếu báo')) {
      return { url: '/client/maintenance', label: 'Tạo phiếu báo hỏng' };
    }
    if (lower.includes('tra cứu phòng') || lower.includes('danh sách phòng') || lower.includes('phòng còn chỗ')) {
      return { url: '/client/rooms', label: 'Tra cứu phòng KTX' };
    }
    if (lower.includes('bảng tin') || lower.includes('thông báo')) {
      return { url: '/client/notifications', label: 'Xem bảng tin thông báo' };
    }
    return null;
  }

  private formatCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
}
