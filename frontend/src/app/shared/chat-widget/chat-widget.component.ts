import {
  Component,
  inject,
  signal,
  computed,
  output,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AIAskResponse, ChatMessage } from '../../core/services/ai.service';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css',
})
export class ChatWidgetComponent implements AfterViewChecked {
  private aiService = inject(AiService);

  // Output event để báo parent đóng widget
  closeChat = output<void>();

  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;

  // State
  userInput = signal('');
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      content:
        'Xin chào! Mình là **Trợ lý AI Ký túc xá ICTU** 🤖\n\nMình có thể giúp bạn:\n- 🕒 Giờ mở/đóng cửa KTX\n- 💰 Biểu phí phòng Standard & VIP\n- 📝 Thủ tục đăng ký lưu trú\n- 🛠️ Quy trình báo hỏng thiết bị\n- 📞 Thông tin liên hệ Ban Quản lý\n\nBạn cần hỗ trợ gì hôm nay?',
      timestamp: new Date(),
    },
  ]);

  // Quick suggestions
  suggestions = [
    'Giờ đóng cửa KTX?',
    'Phí phòng VIP là bao nhiêu?',
    'Cách báo hỏng thiết bị?',
    'Hotline Ban Quản lý?',
  ];

  isInputEmpty = computed(() => this.userInput().trim().length === 0);

  private shouldScrollToBottom = false;

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

  sendMessage(): void {
    const prompt = this.userInput().trim();
    if (!prompt || this.isLoading()) return;

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

    this.aiService.ask(prompt).subscribe({
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
