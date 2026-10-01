import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AiAssistantService } from '../../../core/services/ai-assistant.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBot,
  lucideMessageCircle,
  lucideSend,
  lucideSparkles,
  lucideX,
  lucideMinus,
  lucideArrowRight,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-dorm-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideBot,
      lucideMessageCircle,
      lucideSend,
      lucideSparkles,
      lucideX,
      lucideMinus,
      lucideArrowRight,
    }),
  ],
  templateUrl: './dorm-ai-chatbot.component.html',
  styleUrl: './dorm-ai-chatbot.component.css',
})
export class DormAiChatbotComponent implements AfterViewChecked {
  readonly aiService = inject(AiAssistantService);
  private router = inject(Router);

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  inputText = '';
  private shouldScroll = false;

  readonly quickChips = [
    'Phòng nào còn chỗ?',
    'Quy chế giờ mở cửa?',
    'Gửi yêu cầu sửa chữa thiết bị',
  ];

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  toggleChat(): void {
    this.aiService.toggleChat();
    if (this.aiService.isOpen()) {
      this.shouldScroll = true;
    }
  }

  closeChat(): void {
    this.aiService.closeChat();
  }

  onSend(): void {
    const query = this.inputText.trim();
    if (!query || this.aiService.isTyping()) return;

    this.inputText = '';
    this.aiService.sendMessage(query);
    this.shouldScroll = true;
  }

  onSelectChip(chip: string): void {
    if (this.aiService.isTyping()) return;
    this.aiService.sendMessage(chip);
    this.shouldScroll = true;
  }

  navigateToAction(url: string): void {
    this.router.navigateByUrl(url);
    // Tùy chọn thu gọn trên màn hình nhỏ để xem trang
    if (window.innerWidth < 640) {
      this.aiService.closeChat();
    }
  }

  cleanMarkdown(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bỏ in đậm **text** -> text
      .replace(/^\s*\*\s+/gm, '- ')      // Đổi * đầu dòng thành -
      .replace(/\*(.*?)\*/g, '$1')     // Bỏ in nghiêng *text* -> text
      .replace(/\*/g, '');             // Bỏ dấu hoa thị còn sót
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
