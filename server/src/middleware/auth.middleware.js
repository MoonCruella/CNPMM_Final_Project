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
    if (error.name === 'TokenExpiredError') {
      return response.sendError(res, 'jwt expired', 401); // để client interceptor refresh
    }
    return response.sendError(res, 'Token không hợp lệ', 401, error.message);
  
  }
};
// middleware để kiểm tra xác thực nhưng không yêu cầu
export const checkAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']; // Sử dụng cách viết giống authenticateToken
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = verifyAccessToken(token);
      console.log("DEBUG - checkAuth decoded token:", decoded); // Thêm log để debug
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    console.log("DEBUG - checkAuth error:", error); // Thêm log để debug
    next();
  }
};
// Middleware kiểm tra role admin
export const requireAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'seller') {
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
    
    if (req.user.role === 'seller' || req.user.userId === resourceUserId) {
      next();
    } else {
      return response.sendError(res, 'Không có quyền truy cập tài nguyên này', 403);
    }
  } catch (error) {
    return response.sendError(res, 'Lỗi kiểm tra quyền truy cập', 500, error.message);
  }
};

