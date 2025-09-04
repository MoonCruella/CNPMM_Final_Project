import { verifyAccessToken } from '../utils/jwt.js';
import { User } from '../models/index.model.js';
import response from '../helpers/response.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return response.sendError(res, 'Access token không được cung cấp', 401);
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.active) {
      return response.sendError(res, 'User không hợp lệ hoặc đã bị khóa', 401);
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return response.sendError(res, 'Token không hợp lệ hoặc đã hết hạn', 403, error.message);
  }
};

// Middleware kiểm tra role admin
export const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return response.sendError(res, 'Không có quyền truy cập. Cần role admin', 403);
    }
    next();
  } catch (error) {
    return response.sendError(res, 'Lỗi kiểm tra quyền admin', 500, error.message);
  }
};

// Middleware kiểm tra user hoặc admin (có thể truy cập tài nguyên của chính mình)
export const requireOwnerOrAdmin = async (req, res, next) => {
  try {
    const resourceUserId = req.params.userId || req.body.userId;
    
    if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
      next();
    } else {
      return response.sendError(res, 'Không có quyền truy cập tài nguyên này', 403);
    }
  } catch (error) {
    return response.sendError(res, 'Lỗi kiểm tra quyền truy cập', 500, error.message);
  }
};