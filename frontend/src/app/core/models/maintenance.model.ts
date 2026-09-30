import { Room } from './room.model';

export type MaintenanceUrgency = 'LOW' | 'MEDIUM' | 'HIGH';
export type MaintenanceStatus = 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';

export interface MaintenanceRequest {
  id: number;
  roomId: number;
  room?: Room;
  userId: number;
  user?: {
    id: number;
    fullName: string;
    studentCode: string;
    phone?: string;
    email?: string;
    gender?: string;
  };
  title: string;
  description: string;
  urgency: MaintenanceUrgency;
  status: MaintenanceStatus;
  adminFeedback?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceStats {
  total: number;
  pending: number;
  processing: number;
  resolved: number;
  rejected: number;
  highUrgency: number;
}

export interface MaintenanceQueryParams {
  status?: string;
  urgency?: string;
  building?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateMaintenanceDto {
  roomNumber: string;
  title: string;
  description: string;
  urgency: string;
  studentCode?: string;
}

export interface UpdateMaintenanceStatusDto {
  status: MaintenanceStatus;
  adminFeedback?: string;
}

export interface MaintenanceApiResponse<T = MaintenanceRequest[]> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
