import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import userService from '../services/user.service.js';
import avatarService from '../services/avatarService.js';
import { toast } from 'sonner';
import { useSelector } from 'react-redux'; // Import useSelector từ react-redux

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

  // Lấy state từ Redux
  const reduxUser = useSelector(state => state.auth.user);
  const reduxIsAuthenticated = useSelector(state => state.auth.isAuthenticated);

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

  // THÊM MỚI: Đồng bộ từ Redux sang UserContext khi auth state thay đổi
  useEffect(() => {
    // Chỉ cập nhật nếu reduxUser có giá trị và khác với user hiện tại trong context
    if (reduxUser && reduxIsAuthenticated) {
      
      // Tạo đối tượng user với cấu trúc phù hợp cho UserContext
      const normalizedUser = {
        _id: reduxUser._id,
        email: reduxUser.email,
        name: reduxUser.full_name,
        full_name: reduxUser.full_name,
        role: reduxUser.role,
        avatar: reduxUser.avatar,
        gender: reduxUser.gender,
        avatar_public_id: reduxUser.avatar_public_id,
        date_of_birth: reduxUser.date_of_birth,
        active: reduxUser.active,
        phone: reduxUser.phone,
        address: reduxUser.address,
        createdAt: reduxUser.createdAt,
        updatedAt: reduxUser.updatedAt
      };
      setUser(normalizedUser);
      userService.saveUserToStorage(normalizedUser);
    }
    // Nếu đăng xuất trong Redux, cũng xóa trong Context
    else if (!reduxIsAuthenticated && user) {
      clearUser();
    }
  }, [reduxUser, reduxIsAuthenticated]);

  const syncWithRedux = useCallback((reduxUserData) => {
    if (reduxUserData) {
      
      // Tạo đối tượng user với cấu trúc phù hợp cho UserContext
      const normalizedUser = {
        _id: reduxUserData._id,
        email: reduxUserData.email,
        name: reduxUserData.full_name,
        full_name: reduxUserData.full_name,
        role: reduxUserData.role,
        avatar: reduxUserData.avatar,
        avatar_public_id: reduxUserData.avatar_public_id,
        active: reduxUserData.active,
        phone: reduxUserData.phone,
        address: reduxUserData.address,
        createdAt: reduxUserData.createdAt,
        updatedAt: reduxUserData.updatedAt
      };
      
      setUser(normalizedUser);
      userService.saveUserToStorage(normalizedUser);
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

    //   Xóa ảnh cũ trước khi upload mới (nếu có)
    const oldAvatarPublicId = user?.avatar_public_id;
    if (oldAvatarPublicId) {
      try {
        await avatarService.deleteAvatar(oldAvatarPublicId);
      } catch (deleteError) {
        console.warn('Failed to delete old avatar:', deleteError);
        // Continue với upload mới
      }
    }

    avatarService.validateAvatarFile(avatarFile);

    const uploadResponse = await avatarService.uploadAvatar(avatarFile);

    if (!uploadResponse || !uploadResponse.success) {
      throw new Error(uploadResponse?.message || 'Upload avatar thất bại');
    }

    const avatarData = uploadResponse.data;
    const avatarUrl = avatarData.url;
    const publicId = avatarService.extractPublicId(avatarData.publicId || avatarData.url);


    const updateResponse = await userService.updateUserProfile({
      avatar: avatarUrl,
      avatar_public_id: publicId
    });

    if (updateResponse.success) {
      const updatedUser = updateResponse.data.user;
      
      //   Update với URL mới
      updateUserData({
        avatar: updatedUser.avatar,
        avatar_public_id: updatedUser.avatar_public_id
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
    console.error(' Upload avatar error:', error);
    setError(error.message);
    toast.error(error.message || 'Có lỗi xảy ra khi upload avatar');
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
        avatarService.validateAvatarFile(avatarFile);

        const uploadResponse = await avatarService.uploadAvatar(avatarFile);

        if (uploadResponse.success) {
          const avatarData = uploadResponse.data;
          const avatarUrl = avatarData.url;
          const publicId = avatarService.extractPublicId(avatarData.publicId || avatarData.url);
                    
          // Lưu URL thay vì publicId
          finalUpdateData.avatar = avatarUrl;
          finalUpdateData.avatar_public_id = publicId;
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
      const updatedUser = response.data.user;
      
      //   Update với data từ backend
      updateUserData(updatedUser);


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
        // Update user profile to remove avatar
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

  const getUserAvatarUrl = (size = 40) => {
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
    syncWithRedux, 

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