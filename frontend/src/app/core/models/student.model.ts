export interface OccupiedBedInfo {
  id: number;
  bedNumber: string;
  status?: string;
  room?: {
    id?: number;
    roomNumber: string;
    building: string;
    floor: number;
    pricePerMonth: number | string;
    roomType?: string;
  };
}

export interface StudentProfile {
  id: number;
  fullName: string;
  studentCode: string;
  email: string;
  phone?: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  role: 'STUDENT' | 'ADMIN';
  avatar?: string | null;
  createdAt: string;
  updatedAt?: string;
  occupiedBed?: OccupiedBedInfo | null;
  registrations?: any[];
  maintenanceRequests?: any[];
}

export interface CreateStudentDto {
  fullName: string;
  studentCode: string;
  email: string;
  phone?: string;
  gender: 'MALE' | 'FEMALE';
  defaultPassword?: string;
}

export interface UpdateStudentDto {
  fullName?: string;
  studentCode?: string;
  email?: string;
  phone?: string;
  gender?: 'MALE' | 'FEMALE';
}

export interface StudentApiResponse {
  success: boolean;
  data: StudentProfile[];
  total: number;
  message?: string;
}
