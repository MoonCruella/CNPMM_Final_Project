import apiClient from './api';

class AvatarService {
  
  // Upload avatar to server
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

  // Delete avatar from server
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

  // ✅ Get optimized avatar URL - XỬ LÝ CẢ URL VÀ PUBLIC_ID
  getOptimizedAvatarUrl(avatarInput, size = 200) {
  if (!avatarInput) return null;
  
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnddgulz8';
  
  
  // ✅ CASE 1: Nếu là full Cloudinary URL
  if (typeof avatarInput === 'string' && avatarInput.startsWith('http')) {
    
    const urlParts = avatarInput.split('/upload/');
    
    if (urlParts.length === 2) {
      let publicIdPart = urlParts[1];
      
      // Remove version number if exists (v1234567/)
      publicIdPart = publicIdPart.replace(/^v\d+\//, '');
      
      
      // ✅ Thêm timestamp để bust cache
      const timestamp = Date.now();
      const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${size},h_${size},q_auto,f_auto/${publicIdPart}?v=${timestamp}`;
      
      return optimizedUrl;
    }
    
    // If can't parse, add cache buster to original
    return `${avatarInput}?v=${Date.now()}`;
  }
  
  // ✅ CASE 2: Nếu là public_id thuần
  const timestamp = Date.now();
  const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_${size},h_${size},q_auto,f_auto/${avatarInput}?v=${timestamp}`;
  
  return optimizedUrl;
}

  // ✅ Helper: Extract public_id from URL or return as-is
  extractPublicId(avatarInput) {
    if (!avatarInput) return null;

    // If it's already a public_id (doesn't start with http)
    if (!avatarInput.startsWith('http')) {
      return avatarInput;
    }

    // Extract from full URL
    const urlParts = avatarInput.split('/upload/');
    if (urlParts.length === 2) {
      let publicIdPart = urlParts[1];
      // Remove version number if exists (v1234567/)
      publicIdPart = publicIdPart.replace(/^v\d+\//, '');
      return publicIdPart;
    }

    return avatarInput;
  }

  // Helper: Create avatar URL from any format
  createAvatarUrl(avatarData, size = 200) {
    // If it's already a full URL
    if (typeof avatarData === 'string' && avatarData.startsWith('http')) {
      return this.getOptimizedAvatarUrl(avatarData, size);
    }
    
    // If it's a public_id
    if (typeof avatarData === 'string') {
      return this.getOptimizedAvatarUrl(avatarData, size);
    }
    
    // If it's an object with url property
    if (avatarData?.url) {
      return this.getOptimizedAvatarUrl(avatarData.url, size);
    }
    
    // If it's an object with publicId property
    if (avatarData?.publicId || avatarData?.public_id) {
      return this.getOptimizedAvatarUrl(
        avatarData.publicId || avatarData.public_id, 
        size
      );
    }
    
    return null;
  }

  // Validate avatar file
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