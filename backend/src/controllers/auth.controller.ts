import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { ENV } from '../config/env';

export class AuthController {
  // Đăng nhập hệ thống (hỗ trợ Email hoặc Mã Sinh Viên)
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email / mã sinh viên và mật khẩu',
        });
        return;
      }

      // Tìm kiếm theo email hoặc studentCode
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: String(identifier).trim() },
            { studentCode: String(identifier).trim() },
          ],
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Tài khoản hoặc mật khẩu không chính xác',
        });
        return;
      }

      // Đối chiếu mật khẩu băm
      const isMatch = await bcrypt.compare(String(password), user.password);
      if (!isMatch) {
        res.status(401).json({
          success: false,
          message: 'Tài khoản hoặc mật khẩu không chính xác',
        });
        return;
      }

      // Tạo JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          studentCode: user.studentCode,
        },
        ENV.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Trả về thông tin không kèm mật khẩu
      const { password: _, ...userInfo } = user;

      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công!',
        data: {
          token,
          user: userInfo,
        },
      });
    } catch (error: any) {
      console.error('[AuthController.login Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi đăng nhập',
        error: error.message,
      });
    }
  }

  // Lấy thông tin tài khoản hiện tại từ Token
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Chưa đăng nhập hoặc thiếu token xác thực' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, ENV.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          studentCode: true,
          phone: true,
          gender: true,
          role: true,
          avatar: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('[AuthController.getMe Error]', error);
      res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn',
        error: error.message,
      });
    }
  }

  // Đổi mật khẩu
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Chưa xác thực người dùng' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, ENV.JWT_SECRET);

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới' });
        return;
      }

      if (String(newPassword).length < 6) {
        res.status(400).json({ success: false, message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
        return;
      }

      const isMatch = await bcrypt.compare(String(currentPassword), user.password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
        return;
      }

      const hashedNewPassword = await bcrypt.hash(String(newPassword), 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      });

      res.status(200).json({
        success: true,
        message: 'Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.',
      });
    } catch (error: any) {
      console.error('[AuthController.changePassword Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật mật khẩu',
        error: error.message,
      });
    }
  }

  // Khôi phục mật khẩu (quên mật khẩu)
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { emailOrStudentCode } = req.body;
      if (!emailOrStudentCode) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập email hoặc mã số sinh viên' });
        return;
      }

      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: String(emailOrStudentCode).trim() },
            { studentCode: String(emailOrStudentCode).trim() },
          ],
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài khoản với thông tin đã cung cấp',
        });
        return;
      }

      // Trong môi trường KTX thực tế, gửi hướng dẫn đặt lại qua email hoặc cấp mật khẩu tạm
      // Đặt lại mật khẩu tạm: "ktx123456"
      const tempPass = 'ktx123456';
      const hashedTempPass = await bcrypt.hash(tempPass, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedTempPass },
      });

      res.status(200).json({
        success: true,
        message: `Yêu cầu khôi phục đã được xử lý. Mật khẩu tạm thời của bạn là: "${tempPass}". Vui lòng đăng nhập và đổi mật khẩu ngay lập tức.`,
      });
    } catch (error: any) {
      console.error('[AuthController.forgotPassword Error]', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xử lý yêu cầu khôi phục mật khẩu',
        error: error.message,
      });
    }
  }
}
