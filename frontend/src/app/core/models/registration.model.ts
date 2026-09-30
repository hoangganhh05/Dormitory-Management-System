import { Bed, Room } from './room.model';

export interface RegistrationUser {
  id: number;
  fullName: string;
  studentCode: string;
  email: string;
  phone?: string;
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
  note?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegistrationDto {
  fullName: string;
  studentCode: string;
  email: string;
  phone: string;
  gender: string;
  roomId: number;
  semester: string;
  notes?: string;
}

export interface RegistrationApiResponse {
  success: boolean;
  data: Registration[];
  total: number;
  message?: string;
}
