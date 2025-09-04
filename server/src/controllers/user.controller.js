import response from '../helpers/response.js';
import userModel from '../models/user.model.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res, next) => {
    try {
        const users = await userModel.find().select('-password -refresh_tokens');
        return response.sendSuccess(res, { users }, "Lấy danh sách user thành công", 200);
    }
    catch (err) {
        next(err)
    }
}

export const getUserByEmail = async(req, res, next) => {
    try {
        const { email } = req.params;
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return response.sendError(res, 'Email không hợp lệ', 400);
        }

        const user = await userModel.findOne({ email })
            .select('-password -refresh_tokens')
            .lean()
            .exec();
        
        if (!user){
            return response.sendError(res, 'User không tồn tại', 404);
        }
        
        return response.sendSuccess(res, {
            _id: user._id, 
            email: user.email,
            name: user.name,
            username: user.username,
            phone: user.phone,
            role: user.role,
            active: user.active,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }, "Tìm user thành công", 200);
    }
    catch (err) {
        console.error('Get user by email error:', err);
        return response.sendError(res, "Lỗi tìm kiếm user", 500, err.message);
    }
}

export const getUserList = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "", active } = req.query;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (active !== undefined) filter.active = active === 'true';

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      userModel.find(filter)
        .select('-password -refresh_tokens')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      userModel.countDocuments(filter)
    ]);

    return response.sendSuccess(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }, "Lấy danh sách user thành công", 200);

  } catch (error) {
    console.error('Get user list error:', error);
    return response.sendError(res, "Lấy danh sách user thất bại", 500, error.message);
  }
};

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.sendError(res, 'ID user không hợp lệ', 400);
    }
    
    const user = await userModel
      .findById(userId)
      .select('-password -refresh_tokens');

    if (!user) {
      return response.sendError(res, "User không tồn tại", 404);
    }

    return response.sendSuccess(res, { user }, "Lấy thông tin user thành công", 200);

  } catch (error) {
    console.error('Get user profile error:', error);
    return response.sendError(res, "Lấy thông tin user thất bại", 500, error.message);
  }
};

// ✅ Fixed updateUserProfile using response helper
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.sendError(res, 'ID user không hợp lệ', 400);
    }

    // Remove sensitive fields that shouldn't be updated via this route
    const { password, refresh_tokens, role, ...allowedUpdates } = updateData;

    // Validate required fields
    if (allowedUpdates.name && !allowedUpdates.name.trim()) {
      return response.sendError(res, 'Tên không được để trống', 400);
    }

    // Validate email if provided
    if (allowedUpdates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(allowedUpdates.email)) {
        return response.sendError(res, 'Định dạng email không hợp lệ', 400);
      }

      // Check if email already exists (for other users)
      const existingUser = await userModel.findOne({ 
        email: allowedUpdates.email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return response.sendError(res, 'Email đã tồn tại', 409);
      }
    }

    // Validate phone if provided
    if (allowedUpdates.phone && allowedUpdates.phone.trim()) {
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(allowedUpdates.phone.trim())) {
        return response.sendError(res, 'Số điện thoại không hợp lệ (10-11 số)', 400);
      }
    }

    // Validate date_of_birth if provided
    if (allowedUpdates.date_of_birth) {
      const birthDate = new Date(allowedUpdates.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (birthDate > today || age > 120) {
        return response.sendError(res, 'Ngày sinh không hợp lệ', 400);
      }
    }

    // ✅ UPDATE USER IN DATABASE using userModel
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        ...allowedUpdates,
        updated_at: new Date()
      },
      {
        new: true, // Return updated document
        runValidators: true, // Run schema validators
        select: '-password -refresh_tokens' // Exclude sensitive fields
      }
    );

    if (!updatedUser) {
      return response.sendError(res, 'User không tồn tại', 404);
    }

    return response.sendSuccess(res, {
      user: updatedUser
    }, 'Cập nhật thông tin thành công', 200);

  } catch (error) {
    console.error('Update user profile error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return response.sendError(res, 'Lỗi validation', 400, errors);
    }

    return response.sendError(res, 'Lỗi server', 500, error.message);
  }
};

// ✅ Legacy updateUser function (for backward compatibility)
export const updateUser = async (req, res) => {
  try {
    console.log(req.user);
    const userId = req.user.userId || req.user._id || req.user.id;
    
    // Redirect to updateUserProfile
    req.params.userId = userId;
    return updateUserProfile(req, res);
  } catch (error) {
    console.error('Update user error:', error);
    return response.sendError(res, 'Lỗi cập nhật user', 500, error.message);
  }
};

// ✅ Update user password
export const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return response.sendError(res, 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc', 400);
    }

    if (newPassword.length < 6) {
      return response.sendError(res, 'Mật khẩu mới phải có ít nhất 6 ký tự', 400);
    }

    // Get user with password
    const user = await userModel.findById(userId).select('+password');
    if (!user) {
      return response.sendError(res, 'User không tồn tại', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return response.sendError(res, 'Mật khẩu hiện tại không đúng', 400);
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await userModel.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
      updated_at: new Date()
    });

    return response.sendSuccess(res, {}, 'Đổi mật khẩu thành công', 200);

  } catch (error) {
    console.error('Update password error:', error);
    return response.sendError(res, 'Lỗi đổi mật khẩu', 500, error.message);
  }
};

// ✅ Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.sendError(res, 'ID user không hợp lệ', 400);
    }

    // Prevent deleting admin users
    const userToDelete = await userModel.findById(userId);
    if (!userToDelete) {
      return response.sendError(res, 'User không tồn tại', 404);
    }

    if (userToDelete.role === 'admin') {
      return response.sendError(res, 'Không thể xóa tài khoản admin', 403);
    }

    // Delete user from database
    await userModel.findByIdAndDelete(userId);

    return response.sendSuccess(res, {}, 'Xóa user thành công', 200);

  } catch (error) {
    console.error('Delete user error:', error);
    return response.sendError(res, 'Lỗi xóa user', 500, error.message);
  }
};

// ✅ Toggle user active status (admin only)
export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { active } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return response.sendError(res, 'ID user không hợp lệ', 400);
    }

    if (typeof active !== 'boolean') {
      return response.sendError(res, 'Trạng thái active phải là boolean', 400);
    }

    const user = await userModel.findByIdAndUpdate(
      userId,
      { 
        active: active,
        updated_at: new Date()
      },
      { 
        new: true,
        select: '-password -refresh_tokens'
      }
    );

    if (!user) {
      return response.sendError(res, 'User không tồn tại', 404);
    }

    return response.sendSuccess(res, { user }, 
      `${active ? 'Kích hoạt' : 'Vô hiệu hóa'} user thành công`, 200);

  } catch (error) {
    console.error('Toggle user status error:', error);
    return response.sendError(res, 'Lỗi cập nhật trạng thái user', 500, error.message);
  }
};

// ✅ Get user statistics (admin only)
export const getUserStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, adminUsers, sellerUsers] = await Promise.all([
      userModel.countDocuments(),
      userModel.countDocuments({ active: true }),
      userModel.countDocuments({ role: 'admin' }),
      userModel.countDocuments({ role: 'seller' })
    ]);

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      admins: adminUsers,
      sellers: sellerUsers,
      users: totalUsers - adminUsers - sellerUsers
    };

    return response.sendSuccess(res, { stats }, 'Lấy thống kê user thành công', 200);

  } catch (error) {
    console.error('Get user stats error:', error);
    return response.sendError(res, 'Lỗi lấy thống kê user', 500, error.message);
  }
};