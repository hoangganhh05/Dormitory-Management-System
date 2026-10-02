export type UserRole = 'ADMIN' | 'STUDENT';
export type UserGender = 'MALE' | 'FEMALE' | 'OTHER';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  studentCode?: string | null;
  phone?: string | null;
  gender: UserGender;
  role: UserRole;
  avatar?: string | null;
  createdAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

export interface GoogleLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
  data?: {
    token: string;
    user: AuthUser;
  };
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}
