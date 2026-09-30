import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './client-home.component.html',
  styleUrl: './client-home.component.css'
})
export class ClientHomeComponent {
  studentName = 'Phạm Thị Ngọc Ánh';
  studentCode = 'DTC235200050';
  currentRoom = 'Phòng A101';
  currentBed = 'Giường G2 (Tầng 1 - Tòa A)';
  stayStatus = 'Đang lưu trú';

  quickActions = [
    {
      title: 'Tra cứu phòng trống',
      desc: 'Tìm kiếm phòng theo tòa nhà, tầng, loại phòng tiêu chuẩn/VIP.',
      icon: '🏢',
      link: '/client/rooms',
      badge: 'Còn phòng'
    },
    {
      title: 'Đăng ký lưu trú',
      desc: 'Nộp đơn xin ở Ký túc xá cho học kỳ mới trực tuyến nhanh chóng.',
      icon: '📝',
      link: '/client/register-room',
      badge: 'Đang mở'
    },
    {
      title: 'Báo hỏng cơ sở vật chất',
      desc: 'Gửi yêu cầu sửa chữa bóng đèn, quạt, đường nước, giường tủ.',
      icon: '🛠️',
      link: '/client/maintenance',
      badge: 'Hỗ trợ 24/7'
    },
    {
      title: 'Trợ lý AI Gemini',
      desc: 'Hỏi đáp tức thì về nội quy, giờ đóng cửa, quy định tạm trú.',
      icon: '🤖',
      link: '/client/dashboard',
      badge: 'AI 24/7'
    }
  ];

  announcements = [
    {
      title: 'Quy chế giờ giấc mở cửa Ký túc xá',
      date: 'Hôm nay',
      content: 'Ký túc xá mở cửa từ 05h30 và đóng cửa lúc 23h00 hàng ngày. Sinh viên có việc gấp cần báo trước cán bộ trực.',
      pinned: true
    },
    {
      title: 'Lịch bảo trì hệ thống cấp nước tầng 1 Tòa A',
      date: 'Hôm qua',
      content: 'Ban quản lý thông báo tạm ngừng cấp nước từ 13h30 đến 15h30 ngày thứ Năm để sửa chữa đường ống chính.',
      pinned: false
    }
  ];
}
