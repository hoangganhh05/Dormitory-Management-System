import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityApi {
  accounts: {
    id: {
      initialize(config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        auto_select?: boolean;
      }): void;
      renderButton(element: HTMLElement, options: {
        theme?: string;
        size?: string;
        text?: string;
        shape?: string;
        logo_alignment?: string;
        width?: number;
      }): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private scriptPromise?: Promise<void>;

  renderButton(element: HTMLElement, onCredential: (idToken: string) => void): Promise<void> {
    return this.loadScript().then(() => {
      if (!environment.googleClientId || environment.googleClientId.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
        throw new Error('Google Client ID chưa được cấu hình');
      }

      const google = window.google;
      if (!google) throw new Error('Google Identity Services chưa sẵn sàng');

      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: (response) => onCredential(response.credential),
        auto_select: false,
      });
      element.replaceChildren();
      google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.max(280, Math.min(element.clientWidth || 360, 400)),
      });
    });
  }

  private loadScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.reject(new Error('Google login chỉ chạy trên trình duyệt'));
    if (window.google?.accounts?.id) return Promise.resolve();
    if (this.scriptPromise) return this.scriptPromise;

    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Không thể tải Google Identity Services')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Không thể tải Google Identity Services'));
      document.head.appendChild(script);
    });

    return this.scriptPromise;
  }
}
