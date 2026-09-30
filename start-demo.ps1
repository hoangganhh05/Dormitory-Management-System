# ========================================================================
#   KHỞI ĐỘNG HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ TÍCH HỢP AI (ICTU & TFL TECH)
#   Sinh viên: Phạm Thị Ngọc Ánh - DTC235200050 - Lớp CNTT K22H
#   Cán bộ hướng dẫn: Lê Anh Duy (TFL Technology JSC)
#   Giảng viên hướng dẫn: ThS. Trương Thị Hằng Nga (ICTU)
# ========================================================================

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "  KHỞI ĐỘNG HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ TÍCH HỢP AI (ICTU & TFL TECH)" -ForegroundColor Cyan
Write-Host "  Sinh viên: Phạm Thị Ngọc Ánh - DTC235200050" -ForegroundColor Yellow
Write-Host "========================================================================`n" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Nạp dữ liệu demo an toàn
Write-Host "[1/3] Đang nạp bộ dữ liệu Demo an toàn (Database Seed)..." -ForegroundColor Green
Set-Location -Path "$rootDir\backend"
npm run prisma:seed

# 2. Khởi chạy Backend Server
Write-Host "`n[2/3] Đang khởi chạy Backend API Server (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\backend'; npm run dev"

# 3. Khởi chạy Frontend Angular
Write-Host "`n[3/3] Đang khởi chạy Frontend Angular Portal (Port 4200)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$rootDir\frontend'; npm start"

Start-Sleep -Seconds 3

Write-Host "`n========================================================================" -ForegroundColor Cyan
Write-Host "  HỆ THỐNG ĐÃ ĐƯỢC KHỞI TẠO VÀ SẴN SÀNG CHO BUỔI DEMO BẢO VỆ!" -ForegroundColor Green
Write-Host "  🌐 Client Portal:  http://localhost:4200/" -ForegroundColor White
Write-Host "  🏢 Admin Portal:   http://localhost:4200/admin/dashboard" -ForegroundColor White
Write-Host "  📡 Backend API:    http://localhost:5000/api/health" -ForegroundColor White
Write-Host "`n  🔑 TÀI KHOẢN DEMO ĐĂNG NHẬP:" -ForegroundColor Yellow
Write-Host "  - Quản trị viên: admin@dormitory.com / 123456" -ForegroundColor White
Write-Host "  - Sinh viên:     DTC235200050 (Phạm Thị Ngọc Ánh) / 123456" -ForegroundColor White
Write-Host "========================================================================`n" -ForegroundColor Cyan
