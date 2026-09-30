export interface Bed {
  id: number;
  bedNumber: string;
  roomId: number;
  occupiedById?: number | null;
  status: 'VACANT' | 'OCCUPIED' | 'RESERVED';
}

export interface Room {
  id: number;
  roomNumber: string;
  building: string;
  floor: number;
  roomType: 'STANDARD' | 'VIP';
  pricePerMonth: number | string;
  capacity: number;
  currentOccupancy: number;
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  description?: string;
  beds?: Bed[];
}

export interface RoomApiResponse {
  success: boolean;
  data: Room[];
  total: number;
  message?: string;
}
