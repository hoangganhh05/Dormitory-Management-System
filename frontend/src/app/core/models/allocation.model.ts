import { Bed, Room } from './room.model';
import { StudentProfile } from './student.model';

export type AllocationAction = 'CHECK_IN' | 'TRANSFER' | 'CHECK_OUT';

export interface AllocationHistoryItem {
  id: number;
  userId: number;
  user?: StudentProfile;
  fromBedInfo?: string | null;
  toBedInfo?: string | null;
  actionType: AllocationAction;
  performedBy?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface AllocationStatsSummary {
  totalStudents: number;
  housedStudents: number;
  unassignedStudents: number;
  totalBeds: number;
  vacantBeds: number;
  totalHistories: number;
  actions: {
    checkIn: number;
    transfer: number;
    checkOut: number;
  };
}

export interface AvailableBedItem extends Bed {
  room?: Room;
}

export interface AllocateBedDto {
  studentId: number;
  bedId: number;
  note?: string;
}

export interface TransferBedDto {
  studentId: number;
  targetBedId: number;
  note?: string;
}

export interface CheckOutDto {
  studentId: number;
  note?: string;
}
