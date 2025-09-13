import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { toast } from "sonner";
import { setAuthHeader } from "../services/api";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({});

  // Sync auth state from user data
  const syncAuthState = useCallback((userData = null) => {
    const token = authService.getAccessToken();
    const currentUser = userData || authService.getUser();

    if (token && currentUser && currentUser._id) {
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsSeller(currentUser.role === "seller");
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setIsSeller(false);
    }
  }, []);

  // ✅ Initialize auth - Try getCurrentUser if token exists
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = authService.getAccessToken();

        if (token) {
          if (!authService.isTokenExpired(token)) {
            // Token valid, try to get current user
            try {
              await authService.getCurrentUser();
              const userData = authService.getUser();
              syncAuthState(userData);
            } catch (error) {
              // API call failed, try refresh or fallback to stored data
              console.error("getCurrentUser failed during init:", error);

              try {
                await authService.refreshToken();
                const userData = authService.getUser();
                syncAuthState(userData);
              } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                authService.removeTokens();
              }
            }
          } else {
            // Token expired, try refresh
            try {
              await authService.refreshToken();
              const userData = authService.getUser();
              syncAuthState(userData);
            } catch (error) {
              console.error("Token refresh failed:", error);
              authService.removeTokens();
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        authService.removeTokens();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [syncAuthState]);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.data.success) {
        const userData = authService.getUser();

        if (userData.role === "user") {
          syncAuthState(userData);
          setShowUserLogin(false);
          return response.data;
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          return { success: false, message: "Đăng nhập thất bại!" };
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // ✅ Explicit refreshUserData function
  const refreshUserData = async () => {
    try {
      await authService.getCurrentUser();
      const userData = authService.getUser();
      syncAuthState(userData);
      return userData;
    } catch (error) {
      console.error("Refresh user data error:", error);
      throw error;
    }
  };

  // ✅ Update user - Use updateUserProfile which calls getCurrentUser
  const updateUser = async (userData) => {
    try {
      if (user && user._id) {
        // Use authService.updateUserProfile which calls getCurrentUser
        await authService.updateUserProfile(user._id, userData);
        const updatedUser = authService.getUser();
        syncAuthState(updatedUser);
      }
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    if (response.data.success) {
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
    }
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Silent fail
    } finally {
      setUser(null);
      syncAuthState();
      toast.success("Đăng xuất thành công!");
    }
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch (error) {
      // Silent fail
    } finally {
      syncAuthState();
      navigate("/");
      toast.success("Đã đăng xuất khỏi tất cả thiết bị!");
    }
  };

  // OTP methods
  const verifyOTP = async (email, otp) => {
    const response = await authService.verifyOtpRegister(email, otp);
    if (response.data.success) {
      toast.success("Xác nhận OTP thành công!");
    }
    return response;
  };

  const resendOTP = async (email) => {
    const response = await authService.resendOtpRegister(email);
    if (response.data.success) {
      toast.success("Đã gửi lại mã OTP!");
    }
    return response;
  };

  const forgotPassword = async (email) => {
    const response = await authService.sendOtpForgotPassword(email);
    if (response.data.success) {
      toast.success("Đã gửi mã OTP đến email của bạn!");
    }
    return response;
  };

  const verifyForgotPasswordOTP = async (email, otp) => {
    const response = await authService.verifyOtpForgotPassword(email, otp);
    if (response.data.success) {
      toast.success("Xác nhận OTP thành công!");
    }
    return response;
  };

  const resetPassword = async (email, newPassword) => {
    const response = await authService.resetPassword(email, newPassword);
    if (response.data.success) {
      toast.success("Đặt lại mật khẩu thành công!");
    }
    return response;
  };
  const loginSeller = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.data.success) {
        const userData = authService.getUser();

        if (userData.role === "seller") {
          syncAuthState(userData);
          setShowUserLogin(false);
          return response.data;
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          return { success: false, message: "Đăng nhập thất bại!" };
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Utility functions
  const isActiveUser = () => user?.active === true;
  const isActiveSeller = () => user?.role === "seller";

  const openLogin = () => setShowUserLogin(true);
  const closeLogin = () => setShowUserLogin(false);

  const value = {
    // State
    user,
    isAuthenticated,
    isSeller,
    loading,
    showUserLogin,

    // Methods
    login,
    loginSeller,
    register,
    logout,
    logoutAll,
    refreshUserData,
    updateUser,
    verifyOTP,
    resendOTP,
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword,

    // UI
    openLogin,
    closeLogin,

    // Utils
    isActiveUser,
    isActiveSeller,
    navigate,
    searchQuery,
    setSearchQuery,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
};
