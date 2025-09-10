import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import userService from '../services/user.service.js';
import avatarService from '../services/avatarService.js';
import { toast } from 'sonner';

const UserContext = createContext();

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};

export const UserContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState(null);

  // Load user from localStorage on init
  useEffect(() => {
    const savedUser = userService.getUserFromStorage();
    if (savedUser) {
      setUser(savedUser);
    } else {
      // Nếu không có user trong storage, thử load từ server
      const loadUserFromServer = async () => {
        try {
          const response = await userService.getCurrentUser();
          if (response.success) {
            setUser(response.user);
            userService.saveUserToStorage(response.user);
          }
        } catch (error) {
          console.error('Auto load user failed:', error);
        }
      };

      // Chỉ load nếu có token
      const token = localStorage.getItem('accessToken');
      if (token) {
        loadUserFromServer();
      }
    }
  }, []);

  // Update user in context and localStorage
  const updateUserData = useCallback((newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    userService.saveUserToStorage(updatedUser);
  }, [user]);

  //  Refresh user data from server
  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await userService.getCurrentUser();

      if (response.success) {
        setUser(response.user);
        console.log('UserL: ' + response.user)
        userService.saveUserToStorage(response.user);
        return response.user;
      } else {
        throw new Error(response.message || 'Không thể tải thông tin user');
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
      setError(error.message);
      toast.error('Không thể tải thông tin người dùng');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile only
  const updateUserProfile = async (updateData) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await userService.updateUserProfile(updateData);

      if (response.success) {
        updateUserData(response.data.user);
        toast.success(response.message || 'Cập nhật thông tin thành công!');
        return response;
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update user profile error:', error);
      setError(error.message);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // Upload avatar only
  const uploadAvatar = async (avatarFile) => {
    try {
      setIsUploadingAvatar(true);
      setError(null);

      // Validate file using avatarService
      avatarService.validateAvatarFile(avatarFile);

      // Upload avatar using avatarService
      const uploadResponse = await avatarService.uploadAvatar(avatarFile);


      // ✅ FIX: Response structure is correct, check properly
      if (!uploadResponse || !uploadResponse.success) {
        throw new Error(uploadResponse?.message || 'Upload avatar thất bại');
      }

      // Extract data correctly
      const avatarData = uploadResponse.data;
      const avatarUrl = avatarData.url;
      const publicId = avatarData.publicId;


      // Update user profile với avatar URL mới
      const updateResponse = await userService.updateUserProfile({
        avatar: avatarUrl,
        avatar_public_id: publicId
      });

      console.log('🔍 Profile update response:', updateResponse); // Debug log

      if (updateResponse.success) {
        // Update user avatar in context
        updateUserData({
          avatar: avatarUrl,
          avatar_public_id: publicId
        });

        toast.success('Upload avatar thành công!');
        return {
          success: true,
          data: avatarData,
          message: 'Upload avatar thành công!'
        };
      } else {
        throw new Error(updateResponse.message || 'Không thể cập nhật avatar trong profile');
      }

    } catch (error) {
      

      setError(error.message);

      // Show appropriate error message
      if (error.message.includes('Chỉ chấp nhận file ảnh') ||
        error.message.includes('Kích thước file quá lớn') ||
        error.message.includes('Vui lòng chọn file ảnh')) {
        toast.error(error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(error.message || 'Có lỗi xảy ra khi upload avatar');
      }

      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Update user profile with optional avatar
  const updateUserWithAvatar = async (updateData, avatarFile = null) => {
    try {
      setIsUpdating(true);
      setIsUploadingAvatar(!!avatarFile);
      setError(null);

      let finalUpdateData = { ...updateData };

      // Upload avatar first if provided
      if (avatarFile) {
        try {
          // Validate file using avatarService
          avatarService.validateAvatarFile(avatarFile);

          // Upload avatar using avatarService
          const uploadResponse = await avatarService.uploadAvatar(avatarFile);

          console.log('🔍 Avatar upload in updateUserWithAvatar:', uploadResponse); // Debug

          if (uploadResponse.success) {
            // ✅ FIX: Extract data correctly
            const avatarData = uploadResponse.data;
            finalUpdateData.avatar = avatarData.url;
            finalUpdateData.avatar_public_id = avatarData.publicId;
          } else {
            throw new Error(uploadResponse.message || 'Upload avatar thất bại');
          }
        } catch (uploadError) {
          console.error('Avatar upload failed:', uploadError);
          toast.error(uploadError.message || 'Upload avatar thất bại');
          throw uploadError;
        }
      }


      // Update user profile với data (bao gồm avatar nếu có)
      const response = await userService.updateUserProfile(finalUpdateData);

      if (response.success) {
        updateUserData(response.data.user);

        const successMessage = avatarFile
          ? 'Cập nhật thông tin và avatar thành công!'
          : 'Cập nhật thông tin thành công!';
        toast.success(successMessage);

        return response;
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update user with avatar error:', error);
      setError(error.message);

      if (!error.message.includes('Upload avatar') && !error.message.includes('Chỉ chấp nhận')) {
        toast.error(error.message || 'Có lỗi xảy ra khi cập nhật');
      }

      throw error;
    } finally {
      setIsUpdating(false);
      setIsUploadingAvatar(false);
    }
  };
  // Delete avatar - Using avatarService
  const deleteAvatar = async () => {
    try {
      setIsUploadingAvatar(true);
      setError(null);

      // Get current avatar public_id
      const publicId = user?.avatar_public_id;

      if (!publicId) {
        toast.error('Không có avatar để xóa');
        return;
      }

      // Delete from Cloudinary using avatarService
      const deleteResponse = await avatarService.deleteAvatar(publicId);

      if (deleteResponse.success) {
        // ✅ Update user profile to remove avatar
        const updateResponse = await userService.updateUserProfile({
          avatar: null,
          avatar_public_id: null
        });

        if (updateResponse.success) {
          updateUserData({
            avatar: null,
            avatar_public_id: null
          });

          toast.success('Xóa avatar thành công!');
          return {
            success: true,
            message: 'Xóa avatar thành công!'
          };
        } else {
          throw new Error(updateResponse.message || 'Không thể cập nhật profile sau khi xóa avatar');
        }
      } else {
        throw new Error(deleteResponse.message || 'Xóa avatar thất bại');
      }

    } catch (error) {
      console.error('Delete avatar error:', error);
      setError(error.message);
      toast.error(error.message || 'Có lỗi xảy ra khi xóa avatar');
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Clear user data (logout)
  const clearUser = () => {
    setUser(null);
    setError(null);
    userService.removeUserFromStorage();
  };



  // Computed values using userService helpers
  const getUserDisplayName = () => userService.getUserDisplayName(user);
  const isActiveUser = () => userService.isActiveUser(user);
  const isAdmin = () => userService.isAdmin(user);
  const formatAddress = () => userService.formatAddress(user?.address);

  // Form helpers for address
  const createAddressObject = (addressForm) => userService.createAddressObject(addressForm);

  const getUserAvatarUrl = (size = 200) => {
    if (user?.avatar) {
      
        const serviceUrl = avatarService.getOptimizedAvatarUrl(user.avatar, size);
        return serviceUrl;
      
    }

    const name = user?.name || user?.email || 'User';
    const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=${size}`;
  
    return fallbackUrl;
  };

  const value = {
    // State
    user,
    isLoading,
    isUpdating,
    isUploadingAvatar,
    error,

    // Actions
    updateUserData,
    refreshUserData,
    updateUserProfile,
    uploadAvatar,
    updateUserWithAvatar,
    clearUser,

    // Computed values
    getUserDisplayName,
    getUserAvatarUrl,
    isActiveUser,
    isAdmin,
    formatAddress,

    // Helpers
    createAddressObject,
    isAuthenticated: !!user,
    userId: user?._id
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;