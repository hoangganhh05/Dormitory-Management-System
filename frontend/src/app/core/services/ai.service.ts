import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}
