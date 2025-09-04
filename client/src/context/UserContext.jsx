import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import userService from '../services/user.service.js';
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

  // ✅ Load user from localStorage on init
  useEffect(() => {
  const savedUser = userService.getUserFromStorage();
  if (savedUser) {
    setUser(savedUser);
  } else {
    // ✅ Nếu không có user trong storage, thử load từ server
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

  // ✅ Update user in context and localStorage
  const updateUserData = useCallback((newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    userService.saveUserToStorage(updatedUser);
  }, [user]);

  // ✅ Refresh user data from server
  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await userService.getCurrentUser();
      
      if (response.success) {
        setUser(response.user);
        console.log('UserL: '+ response.user)
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

  // ✅ Update user profile only
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

  // ✅ Upload avatar only
  const uploadAvatar = async (avatarFile) => {
    try {
      setIsUploadingAvatar(true);
      setError(null);

      const response = await userService.uploadAvatar(avatarFile);
      
      if (response.success) {
        // Update user avatar in context
        updateUserData({ 
          avatar: response.data.url
        });
        toast.success(response.message || 'Upload avatar thành công!');
        return response;
      } else {
        throw new Error(response.message || 'Upload avatar thất bại');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      setError(error.message);
      toast.error(error.message || 'Có lỗi xảy ra khi upload avatar');
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // ✅ Update user profile with optional avatar
  const updateUserWithAvatar = async (updateData, avatarFile = null) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await userService.updateUserWithAvatar(updateData, avatarFile);
      
      if (response.success) {
        updateUserData(response.data.user);
        toast.success(response.message || 'Cập nhật thông tin thành công!');
        return response;
      } else {
        throw new Error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update user with avatar error:', error);
      setError(error.message);
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ Clear user data (logout)
  const clearUser = () => {
    setUser(null);
    setError(null);
    userService.removeUserFromStorage();
  };

  // ✅ Computed values using userService helpers
  const getUserDisplayName = () => userService.getUserDisplayName(user);
  const getUserAvatarUrl = (size = 200) => userService.getUserAvatarUrl(user, size);
  const isActiveUser = () => userService.isActiveUser(user);
  const isAdmin = () => userService.isAdmin(user);
  const formatAddress = () => userService.formatAddress(user?.address);

  // ✅ Form helpers for address
  const createAddressObject = (addressForm) => userService.createAddressObject(addressForm);

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