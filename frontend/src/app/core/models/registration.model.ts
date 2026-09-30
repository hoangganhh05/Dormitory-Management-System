import { Bed, Room } from './room.model';

export interface RegistrationUser {
  id: number;
  fullName: string;
  studentCode: string;
  email: string;
  phone?: string | null;
  gender?: string;
}

export interface Registration {
  id: number;
  userId: number;
  user?: RegistrationUser;
  preferredRoomId?: number | null;
  preferredRoom?: Room;
  allocatedBedId?: number | null;
  allocatedBed?: Bed;
  semester: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  note?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateRegistrationDto {
  fullName?: string;
  studentCode?: string;
  email?: string;
  phone?: string;
  gender?: string;
  roomId: number;
  semester: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface ApproveRegistrationDto {
  bedId?: number | null;
}

export interface RejectRegistrationDto {
  rejectionReason: string;
}

export interface RegistrationStatsSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

export interface RegistrationApiResponse {
  success: boolean;
  data: Registration[];
  total: number;
  message?: string;
}
