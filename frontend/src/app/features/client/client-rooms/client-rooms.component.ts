import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RoomService } from '../../../core/services/room.service';
import { Room } from '../../../core/models/room.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideBedDouble, lucideRefreshCw, lucideSearch } from '@ng-icons/lucide';

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
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  providers: [provideIcons({ lucideAlertTriangle, lucideBedDouble, lucideRefreshCw, lucideSearch })],
  templateUrl: './client-rooms.component.html',
  styleUrl: './client-rooms.component.css'
})
export class ClientRoomsComponent implements OnInit {
  private roomService = inject(RoomService);

  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');

  // Filters
  selectedBuilding = signal('ALL');
  selectedType = signal('ALL');
  selectedStatus = signal('ALL');

  // Real data from API
  rooms = signal<RoomItem[]>([]);

  filteredRooms = computed(() => {
    return this.rooms().filter(r => {
      const matchBuilding = this.selectedBuilding() === 'ALL' || r.building.includes(this.selectedBuilding());
      const matchType = this.selectedType() === 'ALL' || r.roomType === this.selectedType();
      const matchStatus = this.selectedStatus() === 'ALL' || r.status === this.selectedStatus();
      return matchBuilding && matchType && matchStatus;
    });
  });

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    this.roomService.getRooms().subscribe({
      next: (apiRooms: Room[]) => {
        const mappedRooms: RoomItem[] = apiRooms.map((r) => {
          const standardAmenities = ['Bình nóng lạnh', 'Quạt trần', 'Bàn học cá nhân', 'Wifi tốc độ cao'];
          const vipAmenities = ['Điều hòa 2 chiều', 'Bình nóng lạnh', 'Tủ lạnh mini', 'Vệ sinh khép kín'];
          return {
            id: r.id,
            roomNumber: r.roomNumber,
            building: r.building,
            floor: r.floor,
            roomType: r.roomType,
            pricePerMonth: Number(r.pricePerMonth),
            capacity: r.capacity,
            currentOccupancy: r.currentOccupancy,
            status: r.status,
            amenities: r.roomType === 'VIP' ? vipAmenities : standardAmenities,
          };
        });

        this.rooms.set(mappedRooms);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('[ClientRoomsComponent Error]', err);
        this.hasError.set(true);
        this.errorMessage.set('Không thể tải danh sách phòng. Vui lòng kiểm tra kết nối mạng và thử lại.');
        this.isLoading.set(false);
      },
    });
  }

  reload(): void {
    this.loadRooms();
  }

  resetFilters(): void {
    this.selectedBuilding.set('ALL');
    this.selectedType.set('ALL');
    this.selectedStatus.set('ALL');
  }
}
