import {
  Component,
  inject,
  signal,
  computed,
  output,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AIAskResponse, ChatMessage, ChatHistoryPayload } from '../../core/services/ai.service';

import { AuthService } from '../../core/services/auth.service';

const STORAGE_KEY = 'ktx_ai_chat_history';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css',
})
export class ChatWidgetComponent implements OnInit, AfterViewChecked {
  private aiService = inject(AiService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  isLoggedIn = this.authService.isLoggedIn;

  // Output event để báo parent đóng widget
  closeChat = output<void>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  private getWelcomeMessage(): ChatMessage {
    const user = this.currentUser();
    const content = user
      ? `Xin chào bạn **${user.fullName}** (${user.studentCode || 'Sinh viên ICTU'})! 🤖\n\nMình là Trợ lý AI Ký túc xá. Mình có thể hỗ trợ bạn:\n- 🏢 Tra cứu phòng ở & vị trí giường của bạn\n- 👥 Danh sách các bạn cùng phòng\n- 📝 Tiến độ xét duyệt đơn đăng ký lưu trú\n- 🛠️ Trạng thái phiếu báo hỏng thiết bị\n- 🕒 Nội quy giờ giấc & an toàn KTX\n\nBạn cần mình hỗ trợ gì hôm nay?`
      : 'Xin chào! Mình là **Trợ lý AI Ký túc xá ICTU** 🤖\n\nMình có thể giúp bạn:\n- 🕒 Giờ mở/đóng cửa KTX\n- 💰 Biểu phí phòng Standard & VIP\n- 📝 Thủ tục đăng ký lưu trú\n- 🛠️ Quy trình báo hỏng thiết bị\n- 📞 Thông tin liên hệ Ban Quản lý\n\nBạn cần hỗ trợ gì hôm nay?';

    return {
      id: 'welcome',
      role: 'bot',
      content,
      timestamp: new Date(),
    };
  }

  // State
  userInput = signal('');
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([]);

  // Quick suggestions theo ngữ cảnh đăng nhập
  suggestions = computed(() => {
    if (this.isLoggedIn()) {
      return [
        'Tôi đang ở phòng nào?',
        'Ai đang ở cùng phòng với tôi?',
        'Đơn của tôi thế nào rồi?',
        'Giờ đóng cửa KTX là mấy giờ?',
      ];
    }
    return [
      'Giờ đóng cửa KTX?',
      'Phí phòng VIP là bao nhiêu?',
      'Cách báo hỏng thiết bị?',
      'Hotline Ban Quản lý?',
    ];
  });

  isInputEmpty = computed(() => this.userInput().trim().length === 0);
  hasConversationHistory = computed(() => this.messages().length > 1);

  private shouldScrollToBottom = false;

  ngOnInit(): void {
    this.messages.set([this.getWelcomeMessage()]);
    this.restoreChatHistory();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  /**
   * Khôi phục lịch sử chat từ localStorage nếu có
   */
  private restoreChatHistory(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const restoredMessages: ChatMessage[] = parsed.map(item => ({
            id: item.id || `msg-${Date.now()}-${Math.random()}`,
            role: item.role,
            content: item.content,
            timestamp: item.timestamp ? new Date(item.timestamp) : new Date(),
          }));
          this.messages.set(restoredMessages);
          this.shouldScrollToBottom = true;
        }
      }
    } catch (e) {
      console.warn('[ChatWidget] Không thể đọc lịch sử chat từ localStorage:', e);
    }
  }

  /**
   * Lưu tin nhắn hiện tại vào localStorage
   */
  private saveChatHistory(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const cleanMessages = this.messages().filter(m => !m.isLoading);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanMessages));
    } catch (e) {
      console.warn('[ChatWidget] Không thể lưu lịch sử chat vào localStorage:', e);
    }
  }

  /**
   * Xóa toàn bộ lịch sử và bắt đầu phiên mới
   */
  clearHistory(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.messages.set([this.getWelcomeMessage()]);
    this.userInput.set('');
    this.shouldScrollToBottom = true;
  }

  sendMessage(): void {
    const prompt = this.userInput().trim();
    if (!prompt || this.isLoading()) return;

    // Chuẩn bị context lịch sử gửi lên backend (tối đa 6 tin gần nhất)
    const contextHistory: ChatHistoryPayload[] = this.messages()
      .filter(m => !m.isLoading && m.content && m.content.trim().length > 0 && m.id !== 'welcome')
      .slice(-6)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    // Thêm tin nhắn người dùng
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };
    this.messages.update(msgs => [...msgs, userMsg]);
    this.userInput.set('');
    this.shouldScrollToBottom = true;

    // Thêm typing indicator
    const loadingId = `loading-${Date.now()}`;
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: 'bot',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    this.messages.update(msgs => [...msgs, loadingMsg]);
    this.isLoading.set(true);
    this.shouldScrollToBottom = true;

    this.aiService.ask(prompt, contextHistory).subscribe({
      next: (res: AIAskResponse) => {
        // Xóa typing indicator và thêm câu trả lời thật
        this.messages.update(msgs =>
          msgs
            .filter(m => m.id !== loadingId)
            .concat({
              id: `bot-${Date.now()}`,
              role: 'bot',
              content: res.data.answer,
              timestamp: new Date(),
            })
        );
        this.isLoading.set(false);
        this.shouldScrollToBottom = true;
        this.saveChatHistory();
      },
      error: () => {
        this.messages.update(msgs =>
          msgs
            .filter(m => m.id !== loadingId)
            .concat({
              id: `bot-err-${Date.now()}`,
              role: 'bot',
              content:
                '😔 Xin lỗi, hiện tại dịch vụ AI đang bận. Vui lòng thử lại sau hoặc liên hệ trực tiếp Ban Quản lý KTX qua hotline **0985.333.555**.',
              timestamp: new Date(),
            })
        );
        this.isLoading.set(false);
        this.shouldScrollToBottom = true;
        this.saveChatHistory();
      },
    });
  }

  useSuggestion(text: string): void {
    this.userInput.set(text);
    this.sendMessage();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onClose(): void {
    this.closeChat.emit();
  }

  // Render markdown bold (**text**) và line breaks
  renderContent(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }
}
