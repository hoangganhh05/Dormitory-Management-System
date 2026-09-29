export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  details?: any;
  timestamp?: string;
}

export interface JwtUserPayload {
  userId: number;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  studentCode?: string | null;
}
