import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface RoomItem {
  id: number;
  roomNumber: string;
  building: string;
  floor: number;
  roomType: 'STANDARD' | 'VIP';
  pricePerMonth: number;
  capacity: number;
  currentOccupancy: number;
  status: 'AVAILABLE' | 'FULL' | 'MAINTENANCE';
  amenities: string[];
}

@Component({
  selector: 'app-client-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './client-rooms.component.html',
  styleUrl: './client-rooms.component.css'
})
export class ClientRoomsComponent {
  isLoading = signal(false);
  hasError = signal(false);

  // Filters
  selectedBuilding = signal('ALL');
  selectedType = signal('ALL');
  selectedStatus = signal('ALL');

  // Mock data aligned with database seed
  rooms = signal<RoomItem[]>([
    {
      id: 1,
      roomNumber: 'A101',
      building: 'Tòa A (Nam)',
      floor: 1,
      roomType: 'STANDARD',
      pricePerMonth: 450000,
      capacity: 4,
      currentOccupancy: 1,
      status: 'AVAILABLE',
      amenities: ['Bình nóng lạnh', 'Quạt trần', 'Bàn học cá nhân', 'Wifi tốc độ cao']
    },
    {
      id: 2,
      roomNumber: 'A102',
      building: 'Tòa A (Nam)',
      floor: 1,
      roomType: 'VIP',
      pricePerMonth: 750000,
      capacity: 2,
      currentOccupancy: 0,
      status: 'AVAILABLE',
      amenities: ['Điều hòa 2 chiều', 'Bình nóng lạnh', 'Tủ lạnh mini', 'Vệ sinh khép kín']
    },
    {
      id: 3,
      roomNumber: 'B101',
      building: 'Tòa B (Nữ)',
      floor: 1,
      roomType: 'STANDARD',
      pricePerMonth: 450000,
      capacity: 4,
      currentOccupancy: 1,
      status: 'AVAILABLE',
      amenities: ['Bình nóng lạnh', 'Quạt trần', 'Bàn học cá nhân', 'Ban công thoáng mát']
    },
    {
      id: 4,
      roomNumber: 'B102',
      building: 'Tòa B (Nữ)',
      floor: 1,
      roomType: 'VIP',
      pricePerMonth: 750000,
      capacity: 2,
      currentOccupancy: 2,
      status: 'FULL',
      amenities: ['Điều hòa 2 chiều', 'Bình nóng lạnh', 'Tủ lạnh mini', 'Vệ sinh khép kín']
    }
  ]);

  filteredRooms = computed(() => {
    return this.rooms().filter(r => {
      const matchBuilding = this.selectedBuilding() === 'ALL' || r.building.includes(this.selectedBuilding());
      const matchType = this.selectedType() === 'ALL' || r.roomType === this.selectedType();
      const matchStatus = this.selectedStatus() === 'ALL' || r.status === this.selectedStatus();
      return matchBuilding && matchType && matchStatus;
    });
  });

  reload(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 600);
  }

  resetFilters(): void {
    this.selectedBuilding.set('ALL');
    this.selectedType.set('ALL');
    this.selectedStatus.set('ALL');
  }
}
