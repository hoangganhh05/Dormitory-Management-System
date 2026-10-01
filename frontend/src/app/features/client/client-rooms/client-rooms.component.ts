import { Component, signal, computed, OnInit, OnDestroy, inject, ViewChild, ViewContainerRef, ComponentRef, effect } from '@angular/core';
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

type RoomViewMode = '2d' | '3d';

@Component({
  selector: 'app-client-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  providers: [provideIcons({ lucideAlertTriangle, lucideBedDouble, lucideRefreshCw, lucideSearch })],
  templateUrl: './client-rooms.component.html',
  styleUrl: './client-rooms.component.css'
})
export class ClientRoomsComponent implements OnInit, OnDestroy {
  private roomService = inject(RoomService);

  @ViewChild('threeViewerHost', { read: ViewContainerRef, static: true })
  private threeViewerHost!: ViewContainerRef;

  private threeViewerRef: ComponentRef<unknown> | null = null;
  private viewerLoadToken = 0;

  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');

  // Filters
  selectedBuilding = signal('ALL');
  selectedType = signal('ALL');
  selectedStatus = signal('ALL');
  viewMode = signal<RoomViewMode>('2d');
  is3dViewerLoading = signal(false);

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

  private readonly sync3dViewerRooms = effect(() => {
    const filteredRooms = this.filteredRooms();

    if (filteredRooms.length === 0 && this.viewMode() === '3d') {
      this.destroy3dViewer();
      return;
    }

    this.threeViewerRef?.setInput('rooms', filteredRooms);
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
        if (this.viewMode() === '3d') {
          void this.ensure3dViewer();
        }
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

  ngOnDestroy(): void {
    this.destroy3dViewer();
    this.sync3dViewerRooms.destroy();
  }

  resetFilters(): void {
    this.selectedBuilding.set('ALL');
    this.selectedType.set('ALL');
    this.selectedStatus.set('ALL');
  }

  async setViewMode(mode: RoomViewMode): Promise<void> {
    this.viewMode.set(mode);

    if (mode === '2d') {
      this.destroy3dViewer();
      return;
    }

    await this.ensure3dViewer();
  }

  private async ensure3dViewer(): Promise<void> {
    if (this.threeViewerRef || this.is3dViewerLoading() || this.filteredRooms().length === 0) {
      return;
    }

    const loadToken = ++this.viewerLoadToken;
    this.is3dViewerLoading.set(true);

    try {
      const { Dormitory3dViewerComponent } = await import(
        '../../../shared/components/dormitory-3d-viewer/dormitory-3d-viewer.component'
      );

      if (loadToken !== this.viewerLoadToken || this.viewMode() !== '3d') {
        return;
      }

      this.threeViewerRef = this.threeViewerHost.createComponent(Dormitory3dViewerComponent);
      this.threeViewerRef.setInput('rooms', this.filteredRooms());
      this.threeViewerRef.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error('[ClientRoomsComponent] Could not load 3D viewer', error);
      this.viewMode.set('2d');
    } finally {
      if (loadToken === this.viewerLoadToken) {
        this.is3dViewerLoading.set(false);
      }
    }
  }

  private destroy3dViewer(): void {
    this.viewerLoadToken += 1;
    this.is3dViewerLoading.set(false);
    this.threeViewerHost?.clear();
    this.threeViewerRef = null;
  }
}
