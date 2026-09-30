import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface AIAskResponse {
  success: boolean;
  data: {
    answer: string;
    source: 'GEMINI_LIVE' | 'KNOWLEDGE_BASE_FALLBACK';
    modelUsed: string;
    isAiGenerated: boolean;
    timestamp: string;
  };
}

export interface AIStatusResponse {
  success: boolean;
  data: {
    isConfigured: boolean;
    model: string;
    provider: string;
    features: string[];
    securityMode: string;
    rateLimitInfo: {
      freeTierRPM: number;
      freeTierRPD: number;
      recommendedModel: string;
    };
  };
}

export interface ChatHistoryPayload {
  role: 'user' | 'bot';
  content: string;
}

export interface AILogUser {
  id: number;
  fullName: string;
  studentCode: string | null;
  email: string;
  gender: string;
}

export interface AILogItem {
  id: number;
  userMessage: string;
  botReply: string;
  source: 'GEMINI_LIVE' | 'KNOWLEDGE_BASE_FALLBACK';
  model: string;
  createdAt: string;
  user: AILogUser | null;
}

export interface AILogsResponse {
  success: boolean;
  data: {
    logs: AILogItem[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface AIStatsData {
  totalQueries: number;
  todayQueries: number;
  bySource: {
    geminiLive: number;
    fallbackKnowledge: number;
  };
  byUserType: {
    authenticated: number;
    guest: number;
  };
  serviceStatus: {
    isConfigured: boolean;
    model: string;
    provider: string;
    features: string[];
    securityMode: string;
    rateLimitInfo: {
      freeTierRPM: number;
      freeTierRPD: number;
      recommendedModel: string;
    };
  };
}

export interface AIStatsResponse {
  success: boolean;
  data: AIStatsData;
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ai`;

  ask(prompt: string, history?: ChatHistoryPayload[]): Observable<AIAskResponse> {
    const payload: { prompt: string; history?: ChatHistoryPayload[] } = { prompt };
    if (history && history.length > 0) {
      payload.history = history;
    }
    return this.http.post<AIAskResponse>(`${this.apiUrl}/ask`, payload);
  }

  getStatus(): Observable<AIStatusResponse> {
    return this.http.get<AIStatusResponse>(`${this.apiUrl}/status`);
  }

  getLogs(params?: { page?: number; limit?: number; search?: string; source?: string }): Observable<AILogsResponse> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.source) httpParams = httpParams.set('source', params.source);

    return this.http.get<AILogsResponse>(`${this.apiUrl}/logs`, { params: httpParams });
  }

  getStats(): Observable<AIStatsResponse> {
    return this.http.get<AIStatsResponse>(`${this.apiUrl}/stats`);
  }
}
