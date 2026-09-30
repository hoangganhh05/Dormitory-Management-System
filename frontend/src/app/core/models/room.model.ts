export interface BedOccupant {
  id: number;
  fullName: string;
  studentCode: string;
  phone?: string | null;
  email?: string;
  gender?: string;
}

export interface Bed {
  id: number;
  bedNumber: string;
  roomId: number;
  occupiedById?: number | null;
  occupiedBy?: BedOccupant | null;
  status: 'VACANT' | 'OCCUPIED' | 'RESERVED';
}

export interface Room {
  id: number;
  roomNumber: string;
  building: string;
  floor: number;
  roomType: 'STANDARD' | 'VIP';
  pricePerMonth: number;
  capacity: number;
  currentOccupancy: number;
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  description?: string | null;
  beds?: Bed[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoomDto {
  roomNumber: string;
  building: string;
  floor: number;
  roomType: 'STANDARD' | 'VIP';
  pricePerMonth: number;
  capacity: number;
  description?: string;
}

export interface UpdateRoomDto {
  roomNumber?: string;
  building?: string;
  floor?: number;
  roomType?: 'STANDARD' | 'VIP';
  pricePerMonth?: number;
  status?: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  description?: string;
}

export interface BuildingStat {
  building: string;
  totalRooms: number;
  capacity: number;
  occupancy: number;
  availableBeds: number;
}

export interface RoomStatsSummary {
  totalRooms: number;
  totalCapacity: number;
  totalOccupancy: number;
  totalVacantBeds: number;
  occupancyRate: number;
  roomsByStatus: {
    available: number;
    full: number;
    maintenance: number;
  };
  buildings: BuildingStat[];
}

export interface RoomApiResponse {
  success: boolean;
  data: Room[];
  total: number;
  message?: string;
}
