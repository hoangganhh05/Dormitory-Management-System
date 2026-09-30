import { Room } from './room.model';

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
  };
  title: string;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED';
  adminFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceDto {
  roomNumber: string;
  title: string;
  description: string;
  urgency: string;
  studentCode?: string;
}

export interface MaintenanceApiResponse {
  success: boolean;
  data: MaintenanceRequest[];
  total: number;
  message?: string;
}
