import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';
import { Gender, Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_DATA_URL_PATTERN = /^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/i;

export class StudentController {
  // [CLIENT] Sinh viên cập nhật ảnh đại diện bằng data URL ảnh đã chọn.
  static async updateMyAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const avatar = typeof req.body?.avatar === 'string' ? req.body.avatar.trim() : '';

      if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
        return;
      }

      const match = avatar.match(AVATAR_DATA_URL_PATTERN);
      if (!match) {
        res.status(400).json({
          success: false,
          message: 'Ảnh đại diện phải có định dạng JPG, PNG hoặc WEBP hợp lệ',
        });
        return;
      }

      const base64Payload = match[2].replace(/\s/g, '');
      const imageBytes = Buffer.from(base64Payload, 'base64');
      if (!imageBytes.length || imageBytes.length > MAX_AVATAR_BYTES) {
        res.status(400).json({
          success: false,
          message: 'Dung lượng ảnh đại diện không được vượt quá 2MB',
        });
        return;
      }

      const storedAvatar = `data:${match[1].toLowerCase()};base64,${base64Payload}`;
      await prisma.user.update({
        where: { id: req.user.id },
        data: { avatar: storedAvatar },
      });

      res.status(200).json({
        success: true,
        avatar: storedAvatar,
        message: 'Cập nhật ảnh đại diện thành công',
      });
    } catch (error: any) {
      console.error('[StudentController.updateMyAvatar Error]', error);
      res.status(500).json({
        success: false,
        message: 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại sau.',
      });
    }
  }

  // [ADMIN] Lấy danh sách toàn bộ hồ sơ sinh viên lưu trú (hỗ trợ tìm kiếm, lọc)
  static async getAllStudents(req: Request, res: Response): Promise<void> {
    try {
      const { search, gender, status } = req.query;

      const whereClause: any = {
        role: Role.STUDENT,
      };

      if (gender && gender !== 'ALL') {
        whereClause.gender = String(gender) as Gender;
      }

      if (status === 'HOUSED') {
        whereClause.occupiedBed = { isNot: null };
      } else if (status === 'UNASSIGNED') {
        whereClause.occupiedBed = null;
      }

      if (search) {
        whereClause.OR = [
          { fullName: { contains: String(search) } },
          { studentCode: { contains: String(search) } },
          { email: { contains: String(search) } },
          { phone: { contains: String(search) } },
        ];
      }

      const students = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          fullName: true,
          studentCode: true,
          email: true,
          phone: true,
          gender: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          occupiedBed: {
            select: {
              id: true,
              bedNumber: true,
              room: {
                select: {
                  id: true,
                  roomNumber: true,
                  building: true,
                  floor: true,
                  pricePerMonth: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: students,
        total: students.length,
      });
    } catch (error: any) {
      console.error('[StudentController.getAllStudents Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải danh sách hồ sơ sinh viên',
        error: error.message,
      });
    }
  }

  // [ADMIN] Lấy chi tiết hồ sơ một sinh viên theo ID
  static async getStudentById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID sinh viên không hợp lệ' });
        return;
      }

      const student = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          fullName: true,
          studentCode: true,
          email: true,
          phone: true,
          gender: true,
          role: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          occupiedBed: {
            include: {
              room: true,
            },
          },
          registrations: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { preferredRoom: true },
          },
          maintenanceRequests: {
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { room: true },
          },
        },
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ sinh viên' });
        return;
      }

      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error: any) {
      console.error('[StudentController.getStudentById Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy chi tiết hồ sơ sinh viên',
        error: error.message,
      });
    }
  }

  // [ADMIN] Tạo mới hồ sơ sinh viên lưu trú
  static async createStudent(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, studentCode, email, phone, gender, defaultPassword } = req.body;

      if (!fullName || !studentCode || !email) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ Họ tên, Mã sinh viên và Email',
        });
        return;
      }

      // Kiểm tra trùng lặp email hoặc studentCode
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { studentCode }],
        },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          message: 'Mã sinh viên hoặc Email này đã tồn tại trong hệ thống',
        });
        return;
      }

      const rawPassword = defaultPassword || '123456';
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      const newStudent = await prisma.user.create({
        data: {
          fullName: String(fullName).trim(),
          studentCode: String(studentCode).trim().toUpperCase(),
          email: String(email).trim().toLowerCase(),
          phone: phone ? String(phone).trim() : null,
          gender: gender === 'FEMALE' ? Gender.FEMALE : Gender.MALE,
          role: Role.STUDENT,
          password: hashedPassword,
        },
        select: {
          id: true,
          fullName: true,
          studentCode: true,
          email: true,
          phone: true,
          gender: true,
          role: true,
          createdAt: true,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Tạo hồ sơ sinh viên lưu trú thành công!',
        data: newStudent,
      });
    } catch (error: any) {
      console.error('[StudentController.createStudent Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo hồ sơ sinh viên',
        error: error.message,
      });
    }
  }

  // [ADMIN] Cập nhật hồ sơ sinh viên
  static async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'ID sinh viên không hợp lệ' });
        return;
      }

      const { fullName, studentCode, email, phone, gender } = req.body;

      // Kiểm tra tồn tại
      const student = await prisma.user.findUnique({ where: { id } });
      if (!student) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ sinh viên cần cập nhật' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(fullName && { fullName: String(fullName).trim() }),
          ...(studentCode && { studentCode: String(studentCode).trim().toUpperCase() }),
          ...(email && { email: String(email).trim().toLowerCase() }),
          ...(phone !== undefined && { phone: phone ? String(phone).trim() : null }),
          ...(gender && { gender: gender === 'FEMALE' ? Gender.FEMALE : Gender.MALE }),
        },
        select: {
          id: true,
          fullName: true,
          studentCode: true,
          email: true,
          phone: true,
          gender: true,
          role: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin hồ sơ sinh viên thành công!',
        data: updated,
      });
    } catch (error: any) {
      console.error('[StudentController.updateStudent Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật hồ sơ sinh viên',
        error: error.message,
      });
    }
  }

  // [CLIENT] Xem hồ sơ cá nhân của chính mình (chỉ xem dữ liệu được phép)
  static async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Chưa xác thực thông tin đăng nhập' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, ENV.JWT_SECRET);

      const profile = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          fullName: true,
          studentCode: true,
          email: true,
          phone: true,
          gender: true,
          role: true,
          avatar: true,
          createdAt: true,
          occupiedBed: {
            select: {
              id: true,
              bedNumber: true,
              status: true,
              room: {
                select: {
                  roomNumber: true,
                  building: true,
                  floor: true,
                  pricePerMonth: true,
                  roomType: true,
                },
              },
            },
          },
          registrations: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: {
              id: true,
              semester: true,
              status: true,
              createdAt: true,
              preferredRoom: { select: { roomNumber: true, building: true } },
            },
          },
        },
      });

      if (!profile) {
        res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ cá nhân' });
        return;
      }

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      console.error('[StudentController.getMyProfile Error]', error);
      res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
        error: error.message,
      });
    }
  }

  // [CLIENT] Sinh viên tự cập nhật số điện thoại liên lạc của mình
  static async updateMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Chưa xác thực thông tin đăng nhập' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, ENV.JWT_SECRET);

      const { phone } = req.body;
      if (!phone) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp số điện thoại liên hệ mới' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: decoded.id },
        data: { phone: String(phone).trim() },
        select: {
          id: true,
          fullName: true,
          studentCode: true,
          email: true,
          phone: true,
          updatedAt: true,
        },
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật số điện thoại liên lạc thành công!',
        data: updated,
      });
    } catch (error: any) {
      console.error('[StudentController.updateMyProfile Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật thông tin cá nhân',
        error: error.message,
      });
    }
  }
}
