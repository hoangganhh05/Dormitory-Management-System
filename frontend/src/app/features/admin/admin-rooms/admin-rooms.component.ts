import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RoomService } from '../../../core/services/room.service';
import { Bed, CreateRoomDto, Room, RoomStatsSummary, UpdateRoomDto } from '../../../core/models/room.model';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideBedDouble,
  lucideBuilding2,
  lucideCheck,
  lucideCircleAlert,
  lucidePlus,
  lucideRefreshCw,
  lucideSearch,
  lucideX,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-admin-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIcon],
  providers: [
    provideIcons({
      lucideAlertTriangle,
      lucideBedDouble,
      lucideBuilding2,
      lucideCheck,
      lucideCircleAlert,
      lucidePlus,
      lucideRefreshCw,
      lucideSearch,
      lucideX,
    }),
  ],
  templateUrl: './admin-rooms.component.html',
  styleUrl: './admin-rooms.component.css',
})
export class AdminRoomsComponent implements OnInit {
  private roomService = inject(RoomService);
  private fb = inject(FormBuilder);

  rooms = signal<Room[]>([]);
  stats = signal<RoomStatsSummary | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');
  actionSuccessMsg = signal('');

  // Filters
  searchTerm = signal('');
  selectedBuilding = signal('ALL');
  selectedStatus = signal('ALL');
  selectedRoomType = signal('ALL');

  // Modals state
  isCreateModalOpen = signal(false);
  isEditModalOpen = signal(false);
  isDetailModalOpen = signal(false);
  isSubmitting = signal(false);

  selectedRoom = signal<Room | null>(null);

  // Forms
  createForm: FormGroup;
  editForm: FormGroup;

  // Computed filtered rooms
  filteredRooms = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const building = this.selectedBuilding();
    const status = this.selectedStatus();
    const roomType = this.selectedRoomType();

    return this.rooms().filter((r) => {
      const matchSearch =
        !search ||
        r.roomNumber.toLowerCase().includes(search) ||
        r.building.toLowerCase().includes(search);

      const matchBuilding = building === 'ALL' || r.building === building;
      const matchStatus = status === 'ALL' || r.status === status;
      const matchType = roomType === 'ALL' || r.roomType === roomType;

      return matchSearch && matchBuilding && matchStatus && matchType;
    });
  });

  // Buildings list for filter dropdown
  buildingList = computed(() => {
    const unique = new Set<string>();
    this.rooms().forEach((r) => unique.add(r.building));
    return Array.from(unique).sort();
  });

  constructor() {
    this.createForm = this.fb.group({
      roomNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{2,10}$/)]],
      building: ['Tòa A (Nam)', Validators.required],
      floor: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      roomType: ['STANDARD', Validators.required],
      pricePerMonth: [450000, [Validators.required, Validators.min(100000)]],
      capacity: [4, [Validators.required, Validators.min(1), Validators.max(12)]],
      description: [''],
    });

    this.editForm = this.fb.group({
      id: [null],
      roomNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9_-]{2,10}$/)]],
      building: ['', Validators.required],
      floor: [1, [Validators.required, Validators.min(1), Validators.max(20)]],
      roomType: ['STANDARD', Validators.required],
      pricePerMonth: [450000, [Validators.required, Validators.min(100000)]],
      status: ['AVAILABLE', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.roomService.getRooms().subscribe({
      next: (data) => {
        this.rooms.set(data);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        console.error('[AdminRoomsComponent Error]', err);
        this.errorMessage.set('Không thể tải danh sách phòng. Vui lòng thử lại sau.');
        this.isLoading.set(false);
      },
    });

    this.loadStats();
  }

  loadStats(): void {
    this.roomService.getRoomStats().subscribe({
      next: (summary) => {
        this.stats.set(summary);
      },
      error: (err) => console.error('[AdminRoomsComponent loadStats Error]', err),
    });
  }

  // CREATE ROOM
  openCreateModal(): void {
    this.createForm.reset({
      building: 'Tòa A (Nam)',
      floor: 1,
      roomType: 'STANDARD',
      pricePerMonth: 450000,
      capacity: 4,
      description: 'Phòng tiêu chuẩn có điều hòa, nóng lạnh, wifi.',
    });
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitCreateRoom(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const formVal = this.createForm.value;
    const dto: CreateRoomDto = {
      roomNumber: formVal.roomNumber,
      building: formVal.building,
      floor: Number(formVal.floor),
      roomType: formVal.roomType,
      pricePerMonth: Number(formVal.pricePerMonth),
      capacity: Number(formVal.capacity),
      description: formVal.description,
    };

    this.roomService.createRoom(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeCreateModal();
        this.showSuccess(`Đã tạo mới phòng ${dto.roomNumber} (${dto.capacity} giường) thành công!`);
        this.loadData();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        alert(err.message || 'Không thể tạo phòng mới. Vui lòng thử lại sau.');
      },
    });
  }

  // EDIT ROOM
  openEditModal(room: Room): void {
    this.selectedRoom.set(room);
    this.editForm.patchValue({
      id: room.id,
      roomNumber: room.roomNumber,
      building: room.building,
      floor: room.floor,
      roomType: room.roomType,
      pricePerMonth: room.pricePerMonth,
      status: room.status,
      description: room.description || '',
    });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.isEditModalOpen.set(false);
    this.selectedRoom.set(null);
  }

  submitUpdateRoom(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const formVal = this.editForm.value;
    this.isSubmitting.set(true);
    const dto: UpdateRoomDto = {
      roomNumber: formVal.roomNumber,
      building: formVal.building,
      floor: Number(formVal.floor),
      roomType: formVal.roomType,
      pricePerMonth: Number(formVal.pricePerMonth),
      status: formVal.status,
      description: formVal.description,
    };

    this.roomService.updateRoom(formVal.id, dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeEditModal();
        this.showSuccess(`Cập nhật phòng ${dto.roomNumber} thành công!`);
        this.loadData();
      },
      error: (err: Error) => {
        this.isSubmitting.set(false);
        alert(err.message || 'Không thể cập nhật thông tin phòng. Vui lòng thử lại sau.');
      },
    });
  }

  // QUICK TOGGLE MAINTENANCE STATUS
  toggleMaintenance(room: Room): void {
    const newStatus = room.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    const actionLabel = newStatus === 'MAINTENANCE' ? 'chuyển sang BẢO TRÌ' : 'MỞ LẠI SẴN SÀNG';

    if (!confirm(`Bạn có chắc chắn muốn ${actionLabel} cho phòng ${room.roomNumber}?`)) {
      return;
    }

    this.roomService.updateRoom(room.id, { status: newStatus }).subscribe({
      next: () => {
        this.showSuccess(`Phòng ${room.roomNumber} đã ${actionLabel}!`);
        this.loadData();
      },
      error: (err: Error) => alert(err.message || 'Không thể cập nhật trạng thái phòng. Vui lòng thử lại sau.'),
    });
  }

  // DELETE ROOM
  confirmDeleteRoom(room: Room): void {
    if (room.currentOccupancy > 0) {
      alert(`Không thể xóa phòng ${room.roomNumber} vì đang có ${room.currentOccupancy} sinh viên lưu trú!`);
      return;
    }

    if (!confirm(`Xác nhận xóa phòng ${room.roomNumber}? Hành động này sẽ xóa toàn bộ vị trí giường thuộc phòng!`)) {
      return;
    }

    this.roomService.deleteRoom(room.id).subscribe({
      next: () => {
        this.showSuccess(`Đã xóa phòng ${room.roomNumber} khỏi hệ thống!`);
        this.loadData();
      },
      error: (err: Error) => alert(err.message || 'Không thể xóa phòng. Vui lòng thử lại sau.'),
    });
  }

  // VIEW DETAIL & BEDS
  openDetailModal(room: Room): void {
    this.selectedRoom.set(room);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal(): void {
    this.isDetailModalOpen.set(false);
    this.selectedRoom.set(null);
  }

  // UPDATE BED STATUS INSIDE DETAIL MODAL
  changeBedStatus(bed: Bed, targetStatus: 'VACANT' | 'OCCUPIED' | 'RESERVED'): void {
    const room = this.selectedRoom();
    if (!room) return;

    if (bed.status === 'OCCUPIED' && targetStatus === 'VACANT') {
      if (!confirm(`Giường ${bed.bedNumber} đang có sinh viên lưu trú (${bed.occupiedBy?.fullName || 'Chưa rõ'}). Bạn có chắc muốn trả giường trống?`)) {
        return;
      }
    }

    this.roomService.updateBedStatus(room.id, bed.id, targetStatus).subscribe({
      next: (updatedBed) => {
        this.showSuccess(`Cập nhật giường ${bed.bedNumber} thành ${targetStatus}!`);
        // Cập nhật lại state cục bộ của selectedRoom
        const updatedBeds = (room.beds || []).map((b) => (b.id === bed.id ? { ...b, ...updatedBed } : b));
        this.selectedRoom.set({ ...room, beds: updatedBeds });
        this.loadData();
      },
      error: (err: Error) => alert(err.message || 'Không thể cập nhật trạng thái giường. Vui lòng thử lại sau.'),
    });
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedBuilding.set('ALL');
    this.selectedStatus.set('ALL');
    this.selectedRoomType.set('ALL');
  }

  private showSuccess(msg: string): void {
    this.actionSuccessMsg.set(msg);
    setTimeout(() => this.actionSuccessMsg.set(''), 5000);
  }
}
