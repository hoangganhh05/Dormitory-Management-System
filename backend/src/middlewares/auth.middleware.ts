import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { ENV } from '../config/env';

export interface AuthenticatedUser {
  id: number;
  userId?: number;
  email: string;
  role: Role;
  studentCode?: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware xác thực JSON Web Token (JWT)
 * Đọc token từ header 'Authorization: Bearer <token>'
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Yêu cầu xác thực: Không tìm thấy Access Token hợp lệ.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role as Role,
      studentCode: decoded.studentCode,
    };
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc token không hợp lệ.',
      error: error.message,
    });
    return;
  }
};

/**
 * Middleware kiểm tra quyền truy cập theo danh sách Role cho phép (RBAC)
 */
export const requireRoles = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập hoặc thực hiện thao tác này.',
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware yêu cầu quyền Quản trị viên (ADMIN)
 */
export const requireAdmin = requireRoles(Role.ADMIN);

/**
 * Middleware yêu cầu quyền Sinh viên (STUDENT)
 */
export const requireStudent = requireRoles(Role.STUDENT);

/**
 * Middleware xác thực tùy chọn (Optional Auth)
 * Nếu có token hợp lệ -> giải mã gắn req.user; nếu không có -> cho qua để xử lý dạng Khách (GUEST)
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role as Role,
      studentCode: decoded.studentCode,
    };
  } catch {
    // Token không hợp lệ bỏ qua coi như khách
  }
  next();
};
