import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
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

  // Đăng nhập bằng Google Identity Services, chỉ chấp nhận email ICTU.
  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';

      if (!idToken) {
        res.status(400).json({ success: false, message: 'Thiếu Google ID token' });
        return;
      }

      if (!ENV.GOOGLE_CLIENT_ID || ENV.GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
        res.status(503).json({
          success: false,
          message: 'Đăng nhập Google chưa được cấu hình trên hệ thống',
        });
        return;
      }

      const client = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: ENV.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || payload.email_verified !== true) {
        res.status(401).json({ success: false, message: 'Google ID token không có thông tin tài khoản' });
        return;
      }
      const email = payload?.email?.trim().toLowerCase();

      if (!email || !email.endsWith('@ictu.edu.vn')) {
        res.status(403).json({
          success: false,
          message: 'Chỉ chấp nhận tài khoản Google Mail do trường ICTU cấp (@ictu.edu.vn)',
        });
        return;
      }

      const studentCode = email.slice(0, email.indexOf('@')).toUpperCase();
      if (!studentCode) {
        res.status(400).json({ success: false, message: 'Email ICTU không có mã sinh viên hợp lệ' });
        return;
      }

      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.findUnique({ where: { studentCode } });
      }

      if (user?.role === 'ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Tài khoản Google ICTU không được dùng để đăng nhập tài khoản quản trị',
        });
        return;
      }

      const userData = {
        email,
        studentCode,
        fullName: payload.name?.trim() || user?.fullName || studentCode,
        avatar: payload.picture || user?.avatar || null,
      };

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: userData,
        });
      } else {
        const password = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
        user = await prisma.user.create({
          data: {
            ...userData,
            password,
            role: 'STUDENT',
          },
        });
      }

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
      const { password: _, ...userInfo } = user;

      res.status(200).json({
        success: true,
        message: 'Đăng nhập Google ICTU thành công!',
        token,
        user: userInfo,
        data: { token, user: userInfo },
      });
    } catch (error: any) {
      console.error('[AuthController.googleLogin Error]', error);
      res.status(401).json({
        success: false,
        message: 'Google ID token không hợp lệ hoặc đã hết hạn',
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
