import api from './api.js';

class UserService {
  
  // ✅ Storage management
  saveUserToStorage = (userData) => {
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user from storage:', error);
      return null;
    }
  };

  removeUserFromStorage = () => {
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  };

  // ✅ Get current user from server
  getCurrentUser = async () => {
    try {
      const response = await api.get('/api/auth/get-user');
      if (response.data.status) {
              console.log(response.data.user)

        return {
          success: true,
          data: response.data,
          user: response.data.user
        };
      } else {
        throw new Error('Không thể lấy thông tin user');
      }
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Không thể lấy thông tin user',
        error: error.message
      };
    }
  };

  // ✅ Update user profile
  updateUserProfile = async (updateData) => {
    try {
      // Validate required fields
      if (!updateData.name?.trim()) {
        throw new Error('Tên không được để trống');
      }

      // Validate phone if provided
      if (updateData.phone && !/^\d{10,11}$/.test(updateData.phone.trim())) {
        throw new Error('Số điện thoại không hợp lệ (10-11 số)');
      }

      // Validate email if provided
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          throw new Error('Email không hợp lệ');
        }
      }

      // Clean up data - match với user model schema
      const cleanData = {
        name: updateData.name.trim(),
        username: updateData.username?.trim() || null,
        phone: updateData.phone?.trim() || null,
        date_of_birth: updateData.date_of_birth || null,
        gender: updateData.gender || null,
        address: updateData.address ? {
          street: updateData.address.street || '',
          ward: updateData.address.ward || '',
          district: updateData.address.district || '',
          province: updateData.address.province || '', // ✅ Sử dụng province như trong model
          full_address: updateData.address.full_address || ''
        } : null
      };

      const response = await api.put('/api/users/profile/update', cleanData);
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Cập nhật thành công'
        };
      } else {
        throw new Error(response.data.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update user profile error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi cập nhật');
    }
  };

  // ✅ Upload avatar using upload API
  uploadAvatar = async (avatarFile) => {
    try {
      if (!avatarFile) {
        throw new Error('File avatar là bắt buộc');
      }

      // Validate file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(avatarFile.type)) {
        throw new Error('File không hợp lệ. Chỉ chấp nhận JPEG, PNG, GIF, WebP');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (avatarFile.size > maxSize) {
        throw new Error('File quá lớn. Tối đa 5MB');
      }

      // Create FormData for upload
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      // Upload to backend using existing upload route
      const response = await api.post('/api/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Upload avatar thành công'
        };
      } else {
        throw new Error(response.data.message || 'Upload avatar thất bại');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi upload avatar');
    }
  };

  // ✅ Update user profile with avatar
  updateUserWithAvatar = async (updateData, avatarFile = null) => {
    try {
      let avatarData = {};
      
      // Upload avatar first if provided
      if (avatarFile) {
        const uploadResult = await this.uploadAvatar(avatarFile);
        if (uploadResult.success) {
          avatarData = {
            avatar: uploadResult.data.url,
            avatarPublicId: uploadResult.data.publicId
          };
        }
      }

      // Combine profile data with avatar data
      const combinedData = {
        ...updateData,
        ...avatarData
      };

      // Update profile
      return await this.updateUserProfile(combinedData);
    } catch (error) {
      console.error('Update user with avatar error:', error);
      throw error;
    }
  };

  // ✅ Get user display name
  getUserDisplayName = (user) => {
    return user?.name || user?.username || user?.email?.split('@')[0] || 'User';
  };

  // ✅ Get user avatar URL with fallback
  getUserAvatarUrl = (user, size = 200) => {
    if (user?.avatar) return user.avatar;
    const name = this.getUserDisplayName(user);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=${size}`;
  };

  // ✅ Check if user is active
  isActiveUser = (user) => {
    return user?.active === true;
  };

  // ✅ Check if user is admin
  isAdmin = (user) => {
    return user?.role === 'admin';
  };

  // ✅ Format address for display
  formatAddress = (address) => {
    if (!address) return '';
    
    if (address.full_address) return address.full_address;
    
    const parts = [
      address.street,
      address.ward,
      address.district,
      address.province
    ].filter(Boolean);
    
    return parts.join(', ');
  };

  // ✅ Create address object from form data
  createAddressObject = (addressForm) => {
    if (!addressForm) return null;
    
    return {
      street: addressForm.street || '',
      ward: addressForm.ward || '',
      district: addressForm.district || '',
      province: addressForm.province || '', // ✅ Sử dụng province
      full_address: addressForm.full_address || ''
    };
  };
}

export default new UserService();