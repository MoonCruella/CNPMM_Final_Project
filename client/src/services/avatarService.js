import apiClient from './api';

class AvatarService {
  
  // ✅ Upload avatar to server
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/api/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw error;
    }
  }

  // ✅ Delete avatar from server
  async deleteAvatar(publicId) {
    try {
      const response = await apiClient.delete('/api/upload', {
        data: { publicId }
      });

      return response.data;
    } catch (error) {
      console.error('Avatar delete error:', error);
      throw error;
    }
  }

  // ✅ Get optimized avatar URL
  getOptimizedAvatarUrl(publicId, size = 200) {
    if (!publicId) return null;
    
    // ✅ FIX: Use environment variable with fallback
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnddgulz8';
    
    // ✅ Ensure publicId doesn't start with cloudinary domain
    const cleanPublicId = publicId.replace(/^https?:\/\/.*?\/.*?\/.*?\//, '');
    
    const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${size},h_${size},q_auto,f_auto/${cleanPublicId}`;
    
    console.log('🔍 AvatarService - Creating URL:', {
      publicId,
      cleanPublicId,
      cloudName,
      optimizedUrl
    });
    
    return optimizedUrl;
  }
  // ✅ Helper: Create avatar URL from any format
  createAvatarUrl(avatarData, size = 200) {
    // If it's already a full URL
    if (typeof avatarData === 'string' && avatarData.startsWith('http')) {
      return avatarData;
    }
    
    // If it's a public_id
    if (typeof avatarData === 'string') {
      return this.getOptimizedAvatarUrl(avatarData, size);
    }
    
    // If it's an object with url property
    if (avatarData?.url) {
      return avatarData.url;
    }
    
    // If it's an object with publicId property
    if (avatarData?.publicId || avatarData?.public_id) {
      return this.getOptimizedAvatarUrl(avatarData.publicId || avatarData.public_id, size);
    }
    
    return null;
  }

  // ✅ Validate avatar file
  validateAvatarFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
      throw new Error('Vui lòng chọn file ảnh');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
    }

    if (file.size > maxSize) {
      throw new Error('Kích thước file quá lớn. Tối đa 5MB');
    }

    return true;
  }
}

export default new AvatarService();