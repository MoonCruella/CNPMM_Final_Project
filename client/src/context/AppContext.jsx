import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { toast } from "sonner";
import { setAuthHeader, initTokenRefresh } from "../services/api";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const refreshTimerRef = useRef(null);
  const tokenRefreshInProgressRef = useRef(false);

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState({});
  const [tokenRefreshed, setTokenRefreshed] = useState(false);
  const tokenRefreshCleanupRef = useRef(null);
  
  // Đồng bộ hóa trạng thái xác thực từ dữ liệu người dùng
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

  // Thiết lập hẹn giờ tự động làm mới token
  const setupTokenRefreshTimer = useCallback(() => {
    // Xóa bất kỳ bộ hẹn giờ hiện có
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Lấy token hiện tại
    const token = authService.getAccessToken();
    if (!token) return;

    try {
      // Tính toán thời gian còn lại
      const tokenData = authService.decodeToken(token);
      if (!tokenData || !tokenData.exp) return;

      const expiryTime = tokenData.exp * 1000; // Chuyển đổi sang mili giây
      const currentTime = Date.now();
      const timeRemaining = expiryTime - currentTime;
      
      // Đặt ngưỡng làm mới token là 5 phút trước khi hết hạn
      const refreshThreshold = 5 * 60 * 1000; // 5 phút tính bằng mili giây
      
      if (timeRemaining <= refreshThreshold) {
        // Token sắp hết hạn trong thời gian ngưỡng, làm mới ngay
        performTokenRefresh();
      } else {
        // Lên lịch làm mới trong tương lai (5 phút trước khi hết hạn)
        const timeUntilRefresh = timeRemaining - refreshThreshold;
        console.log(`Làm mới token được lên lịch sau ${Math.floor(timeUntilRefresh/1000)} giây`);
        
        refreshTimerRef.current = setTimeout(() => {
          performTokenRefresh();
        }, timeUntilRefresh);
      }
    } catch (error) {
      console.error("Lỗi khi thiết lập hẹn giờ làm mới token:", error);
    }
  }, []);

  // Thực hiện làm mới token
  const performTokenRefresh = async () => {
    // Tránh nhiều lần làm mới đồng thời
    if (tokenRefreshInProgressRef.current) return;
    
    tokenRefreshInProgressRef.current = true;
    
    try {
      console.log("Đang tự động làm mới token...");
      await authService.refreshToken();
      
      // Thông báo cho các component rằng token đã được làm mới
      setTokenRefreshed(prev => !prev);
      
      // Thiết lập hẹn giờ cho lần làm mới tiếp theo
      setupTokenRefreshTimer();
      
      console.log("Token đã được làm mới thành công");
    } catch (error) {
      console.error("Tự động làm mới token thất bại:", error);
      // Nếu làm mới thất bại, người dùng sẽ bị đăng xuất ở lần gọi API tiếp theo
    } finally {
      tokenRefreshInProgressRef.current = false;
    }
  };

  // useEffect cho việc khởi tạo xác thực - chạy một lần khi component mount
useEffect(() => {
  const initAuth = async () => {
    try {
      const token = authService.getAccessToken();

      if (token) {
        if (!authService.isTokenExpired(token)) {
          // Token hợp lệ, thử lấy thông tin người dùng hiện tại
          try {
            await authService.getCurrentUser();
            const userData = authService.getUser();
            syncAuthState(userData);
          } catch (error) {
            // Gọi API thất bại, thử làm mới token hoặc sử dụng dữ liệu đã lưu
            console.error("getCurrentUser thất bại trong quá trình khởi tạo:", error);

            try {
              await authService.refreshToken();
              const userData = authService.getUser();
              syncAuthState(userData);
              setupTokenRefreshTimer();
            } catch (refreshError) {
              console.error("Làm mới token thất bại:", refreshError);
              authService.removeTokens();
            }
          }
        } else {
          // Token hết hạn, thử làm mới
          try {
            await authService.refreshToken();
            const userData = authService.getUser();
            syncAuthState(userData);
            setupTokenRefreshTimer();
          } catch (error) {
            console.error("Làm mới token thất bại:", error);
            authService.removeTokens();
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khởi tạo xác thực:", error);
      authService.removeTokens();
    } finally {
      setLoading(false);
    }
  };

  initAuth();
  
  return () => {
    if(refreshTimerRef.current){
      clearTimeout(refreshTimerRef.current);
    }
  };
}, [syncAuthState, setupTokenRefreshTimer]);

// useEffect riêng cho việc thiết lập auto refresh token dựa trên trạng thái isAuthenticated
useEffect(() => {
  if (isAuthenticated) {
    console.log("🔒 Người dùng đã xác thực, thiết lập hệ thống tự động làm mới token");
    
    // Khởi tạo hệ thống refresh token tự động từ api.js
    tokenRefreshCleanupRef.current = initTokenRefresh();
  } else if (tokenRefreshCleanupRef.current) {
    // Dọn dẹp khi đăng xuất
    console.log("🔓 Người dùng đã đăng xuất, dừng hệ thống tự động làm mới token");
    tokenRefreshCleanupRef.current();
    tokenRefreshCleanupRef.current = null;
  }
  
  return () => {
    if (tokenRefreshCleanupRef.current) {
      tokenRefreshCleanupRef.current();
      tokenRefreshCleanupRef.current = null;
    }
  };
}, [isAuthenticated]); // Chỉ chạy lại khi trạng thái xác thực thay đổi

  // Hàm làm mới token cưỡng bức
  const forceRefreshToken = async () => {
    try {
      await performTokenRefresh();
      return true;
    } catch (error) {
      console.error("Làm mới token cưỡng bức thất bại:", error);
      return false;
    }
  };

  // Đăng nhập người dùng thông thường
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.data.success) {
        const userData = authService.getUser();

        if (userData.role === "user") {
          syncAuthState(userData);
          setShowUserLogin(false);
          setupTokenRefreshTimer();
          return response.data;
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          return { success: false, message: "Đăng nhập thất bại!" };
        }
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      throw error;
    }
  };

  // Hàm làm mới dữ liệu người dùng
  const refreshUserData = async () => {
    try {
      await authService.getCurrentUser();
      const userData = authService.getUser();
      syncAuthState(userData);
      return userData;
    } catch (error) {
      console.error("Lỗi làm mới dữ liệu người dùng:", error);
      throw error;
    }
  };

  // Cập nhật thông tin người dùng
  const updateUser = async (userData) => {
    try {
      if (user && user._id) {
        // Sử dụng authService.updateUserProfile có gọi getCurrentUser
        await authService.updateUserProfile(user._id, userData);
        const updatedUser = authService.getUser();
        syncAuthState(updatedUser);
      }
    } catch (error) {
      console.error("Lỗi cập nhật người dùng:", error);
      throw error;
    }
  };

  // Đăng ký tài khoản mới
  const register = async (userData) => {
    const response = await authService.register(userData);
    if (response.data.success) {
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
    }
    return response;
  };

  // Đăng xuất
  const logout = async () => {
    try {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      await authService.logout();
    } catch (error) {
      // Bỏ qua lỗi
    } finally {
      setUser(null);
      syncAuthState();
      toast.success("Đăng xuất thành công!");
    }
  };

  // Đăng xuất khỏi tất cả thiết bị
  const logoutAll = async () => {
    try {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      await authService.logoutAll();
    } catch (error) {
      // Bỏ qua lỗi
    } finally {
      syncAuthState();
      navigate("/");
      toast.success("Đã đăng xuất khỏi tất cả thiết bị!");
    }
  };

  // Các phương thức xác nhận OTP
  const verifyOTP = async (email, otp) => {
    const response = await authService.verifyOtpRegister(email, otp);
    if (response.data.success) {
      toast.success("Xác nhận OTP thành công!");
    }
    return response;
  };

  // Gửi lại mã OTP
  const resendOTP = async (email) => {
    const response = await authService.resendOtpRegister(email);
    if (response.data.success) {
      toast.success("Đã gửi lại mã OTP!");
    }
    return response;
  };

  // Quên mật khẩu - gửi OTP
  const forgotPassword = async (email) => {
    const response = await authService.sendOtpForgotPassword(email);
    if (response.data.success) {
      toast.success("Đã gửi mã OTP đến email của bạn!");
    }
    return response;
  };

  // Xác nhận OTP quên mật khẩu
  const verifyForgotPasswordOTP = async (email, otp) => {
    const response = await authService.verifyOtpForgotPassword(email, otp);
    if (response.data.success) {
      toast.success("Xác nhận OTP thành công!");
    }
    return response;
  };

  // Đặt lại mật khẩu
  const resetPassword = async (email, newPassword) => {
    const response = await authService.resetPassword(email, newPassword);
    if (response.data.success) {
      toast.success("Đặt lại mật khẩu thành công!");
    }
    return response;
  };

  // Đăng nhập cho người bán
  const loginSeller = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.data.success) {
        const userData = authService.getUser();

        if (userData.role === "seller") {
          syncAuthState(userData);
          setShowUserLogin(false);
          setupTokenRefreshTimer();
          return response.data;
        } else {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          return { success: false, message: "Đăng nhập thất bại!" };
        }
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      throw error;
    }
  };

  // Các hàm tiện ích
  const isActiveUser = () => user?.active === true;
  const isActiveSeller = () => user?.role === "seller";

  const openLogin = () => setShowUserLogin(true);
  const closeLogin = () => setShowUserLogin(false);


  const [isTokenTestMode, setIsTokenTestMode] = useState(false);

  // Bật chế độ kiểm tra token
  const enableTokenTestMode = () => {
    // Xóa bộ hẹn giờ hiện tại nếu có
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    
    setIsTokenTestMode(true);
    console.log("CHẾ ĐỘ KIỂM TRA TOKEN: Kích hoạt (kiểm tra mỗi 10 giây, ngưỡng 20 giây)");
    
    // Thiết lập bộ hẹn giờ kiểm tra mỗi 10 giây
    const checkInterval = setInterval(() => {
      if (!isAuthenticated) {
        clearInterval(checkInterval);
        return;
      }
      
      const token = authService.getAccessToken();
      if (!token) return;
      
      try {
        const tokenData = authService.decodeToken(token);
        if (!tokenData || !tokenData.exp) return;
        
        const expiryTime = tokenData.exp * 1000;
        const currentTime = Date.now();
        const timeRemaining = expiryTime - currentTime;
        
        console.log(`⏱️ Token còn: ${Math.floor(timeRemaining/1000)} giây`);
        
        // Ngưỡng kiểm tra 20 giây
        const testThreshold = 20 * 1000;
        
        if (timeRemaining <= testThreshold) {
          console.log(" Kích hoạt làm mới token (chế độ kiểm tra)");
          performTokenRefresh();
        }
      } catch (error) {
        console.error("Lỗi kiểm tra token:", error);
      }
    }, 10000);
    
    // Lưu interval để có thể hủy sau này
    window.tokenTestInterval = checkInterval;
    
    return () => {
      clearInterval(checkInterval);
      setIsTokenTestMode(false);
    };
  };

  // Tắt chế độ kiểm tra token
  const disableTokenTestMode = () => {
    if (window.tokenTestInterval) {
      clearInterval(window.tokenTestInterval);
      console.log(" CHẾ ĐỘ KIỂM TRA TOKEN: Đã hủy");
    }
    setIsTokenTestMode(false);
    // Khôi phục hẹn giờ bình thường
    setupTokenRefreshTimer();
  };

  const value = {
    // Trạng thái
    user,
    isAuthenticated,
    isSeller,
    loading,
    showUserLogin,

    // Các phương thức
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
    forceRefreshToken,

    // Giao diện
    openLogin,
    closeLogin,

    // Tiện ích
    isActiveUser,
    isActiveSeller,
    navigate,
    searchQuery,
    setSearchQuery,
    enableTokenTestMode,
    disableTokenTestMode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext phải được sử dụng trong AppContextProvider");
  }
  return context;
};