@echo off
chcp 65001 > nul
title HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ TÍCH HỢP AI - DEMO LAUNCHER
echo ========================================================================
echo   KHỞI ĐỘNG HỆ THỐNG QUẢN LÝ KÝ TÚC XÁ TÍCH HỢP AI (ICTU & TFL TECH)
echo   Sinh viên: Phạm Thị Ngọc Ánh - DTC235200050 - Lớp CNTT K22H
echo   Cán bộ hướng dẫn: Lê Anh Duy (TFL Technology JSC)
echo   Giảng viên hướng dẫn: ThS. Trương Thị Hằng Nga (ICTU)
echo ========================================================================
echo.

echo [1/3] Đang nạp dữ liệu Demo an toàn (Database Seed)...
cd /d "%~dp0backend"
call npx prisma db push --skip-generate
call npm run prisma:seed
if %errorlevel% neq 0 (
    echo [CẢNH BÁO] Không thể seed dữ liệu. Tiếp tục khởi động...
)

echo.
echo [2/3] Đang khởi động Backend Server (Port 5000)...
start "KTX Backend API (Port 5000)" cmd /k "cd /d %~dp0backend && npm run dev"

echo.
echo [3/3] Đang khởi động Frontend Web Portal (Port 4200)...
start "KTX Frontend Portal (Port 4200)" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================================================
echo   HỆ THỐNG ĐÃ ĐƯỢC KHỞI ĐỘNG THÀNH CÔNG!
echo.
echo   🌐 Client Portal & Trợ lý AI: http://localhost:4200/
echo   🏢 Admin Portal:              http://localhost:4200/admin/dashboard
echo   📡 Backend REST API:           http://localhost:5000/api/health
echo.
echo   🔑 TÀI KHOẢN TRÌNH DIỄN (DEMO ACCOUNTS):
echo   ----------------------------------------------------------------------
echo   1. Quản trị viên (Admin):
echo      - Email:    admin@dormitory.com
echo      - Mật khẩu: 123456
echo.
echo   2. Sinh viên (Student):
echo      - Email/MSV: DTC235200050 (hoặc ngocanh.cntt@ictu.edu.vn)
echo      - Mật khẩu:  123456
echo ========================================================================
echo.
pause
