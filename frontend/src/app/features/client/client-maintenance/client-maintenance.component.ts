import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface MaintenanceItem {
  id: number;
  roomNumber: string;
  title: string;
  category: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'PROCESSING' | 'RESOLVED';
  createdAt: string;
  feedback?: string;
}

@Component({
  selector: 'app-client-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-maintenance.component.html',
  styleUrl: './client-maintenance.component.css'
})
export class ClientMaintenanceComponent {
  // Form fields
  roomNumber = 'Phòng A101 (Phòng đang ở)';
  title = '';
  category = 'Điện & Quạt';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  description = '';

  isSubmitting = signal(false);
  submitSuccess = signal(false);

  // Maintenance history
  myRequests = signal<MaintenanceItem[]>([
    {
      id: 101,
      roomNumber: 'A101',
      title: 'Hỏng công tắc quạt trần trần phòng ngủ',
      category: 'Điện & Quạt',
      urgency: 'HIGH',
      status: 'PROCESSING',
      createdAt: '30/09/2026',
      feedback: 'Kỹ thuật viên điện nước đã tiếp nhận và sẽ sửa chữa vào 14h00 chiều nay.'
    },
    {
      id: 98,
      roomNumber: 'A101',
      title: 'Vòi xịt vệ sinh bị rỉ nước',
      category: 'Cấp thoát nước',
      urgency: 'MEDIUM',
      status: 'RESOLVED',
      createdAt: '15/09/2026',
      feedback: 'Đã thay mới đầu van khóa nước ngày 16/09.'
    }
  ]);

  onSubmit(): void {
    if (!this.title.trim() || !this.description.trim()) {
      alert('Vui lòng nhập tiêu đề và mô tả sự cố hỏng hóc!');
      return;
    }

    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.submitSuccess.set(true);

      const newItem: MaintenanceItem = {
        id: Math.floor(100 + Math.random() * 900),
        roomNumber: 'A101',
        title: this.title,
        category: this.category,
        urgency: this.urgency,
        status: 'PENDING',
        createdAt: 'Vừa xong'
      };

      this.myRequests.update(list => [newItem, ...list]);

      // Reset form
      this.title = '';
      this.description = '';
      setTimeout(() => this.submitSuccess.set(false), 4000);
    }, 800);
  }
}
