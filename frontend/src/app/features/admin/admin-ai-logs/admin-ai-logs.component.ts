import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AiService,
  AILogItem,
  AIStatsData,
} from '../../../core/services/ai.service';

@Component({
  selector: 'app-admin-ai-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-ai-logs.component.html',
  styleUrl: './admin-ai-logs.component.css',
})
export class AdminAiLogsComponent implements OnInit {
  private aiService = inject(AiService);

  // State Signals
  logs = signal<AILogItem[]>([]);
  stats = signal<AIStatsData | null>(null);
  isLoading = signal(false);
  isLoadingStats = signal(false);

  // Filter & Pagination Signals
  searchTerm = signal('');
  selectedSource = signal('ALL');
  currentPage = signal(1);
  pageSize = signal(15);
  totalPages = signal(1);
  totalLogs = signal(0);

  // Selected log for Detail Modal
  selectedLog = signal<AILogItem | null>(null);

  ngOnInit(): void {
    this.loadStats();
    this.loadLogs();
  }

  loadStats(): void {
    this.isLoadingStats.set(true);
    this.aiService.getStats().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.isLoadingStats.set(false);
      },
      error: (err) => {
        console.error('[AdminAiLogs] Lỗi tải thống kê:', err);
        this.isLoadingStats.set(false);
      },
    });
  }

  loadLogs(): void {
    this.isLoading.set(true);
    this.aiService
      .getLogs({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchTerm().trim() || undefined,
        source: this.selectedSource() !== 'ALL' ? this.selectedSource() : undefined,
      })
      .subscribe({
        next: (res) => {
          this.logs.set(res.data.logs);
          this.totalPages.set(res.data.pagination.totalPages);
          this.totalLogs.set(res.data.pagination.total);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('[AdminAiLogs] Lỗi tải nhật ký:', err);
          this.isLoading.set(false);
        },
      });
  }

  onSearch(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  onSourceChange(source: string): void {
    this.selectedSource.set(source);
    this.currentPage.set(1);
    this.loadLogs();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadLogs();
    }
  }

  openDetail(log: AILogItem): void {
    this.selectedLog.set(log);
  }

  closeDetail(): void {
    this.selectedLog.set(null);
  }

  formatAnswerPreview(text: string): string {
    if (!text) return '';
    const clean = text.replace(/\*\*/g, '').replace(/\n/g, ' ');
    return clean.length > 90 ? clean.substring(0, 90) + '...' : clean;
  }
}
