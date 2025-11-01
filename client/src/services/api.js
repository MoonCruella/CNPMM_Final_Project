import axios from "axios";
import authService from "./authService";
import { store } from "../redux/store"; 
import { fetchCurrentUser } from "../redux/authSlice";
import { logout, updateToken } from "../redux/authSlice";
// Config cho API calls
const API_TIMEOUT = 30000; // 30 giây timeout cho requests
const MAX_RETRIES = 2; // Số lần retry tối đa khi request bị lỗi mạng

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // lấy từ .env
  withCredentials: true, // gửi cookie/session
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_TIMEOUT,
});

let isRefreshing = false;
let refreshSubscribers = [];

// Helper functions cho token management
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

export const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    setAuthHeader(accessToken);
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
  if (accessToken) {
    store.dispatch(updateToken({ accessToken, refreshToken }));
  }
};

const removeTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  setAuthHeader(null);
  store.dispatch(logout());
};

// Thêm subscriber vào queue khi đang refresh token
const addSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Thực hiện tất cả request đang chờ sau khi refresh token thành công
const processSubscribers = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Kiểm tra thời gian còn lại của token
export const getTokenTimeRemaining = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return 0;
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    return Math.max(0, payload.exp * 1000 - Date.now());
  } catch (error) {
    console.error('Lỗi khi tính thời gian token:', error);
    return 0;
  }
};

// Kiểm tra token có còn hạn không
export const isTokenValid = () => {
  return getTokenTimeRemaining() > 0;
};

// Hàm refresh token thủ công
export const refreshToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      addSubscriber((token) => {
        if (token) resolve(token);
        else reject(new Error("Failed to refresh token"));
      });
    });
  }

  isRefreshing = true;

  try {
    const rToken = getRefreshToken();
    
    if (!rToken) throw new Error("No refresh token available");

    
    const resp = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token`,
      { refreshToken: rToken },
      { 
        headers: { "Content-Type": "application/json" }, 
        withCredentials: true,
        timeout: 10000
      }
    );

    const data = resp.data?.data || {};
    const newAccess = data.accessToken || data.token || null;
    const newRefresh = data.refreshToken || null;
    const userData = data.user || null;

    if (!newAccess) throw new Error("No access token in refresh response");

    
    // Lưu user data mới vào localStorage
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }

    setTokens(newAccess, newRefresh);
    processSubscribers(newAccess);
    isRefreshing = false;

    return newAccess;
  } catch (error) {
    console.error('Refresh token thất bại:', error.message);
    processSubscribers(null);
    isRefreshing = false;
    throw error;
  }
};

// Khởi tạo hệ thống refresh token
export const initTokenRefresh = () => {
  
  // Xóa cấu hình refresh cũ nếu có
  if (window.tokenRefreshInterval) {
    clearInterval(window.tokenRefreshInterval);
  }

  
  // Thiết lập ngưỡng refresh token - 5 phút
  const REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 phút
  
  // Kiểm tra token ngay khi khởi động (khi reload page)
  const checkAndRefreshOnInit = async () => {
    
    try {
      const token = localStorage.getItem('accessToken');
      
      
      if (!token) {
        return;
      }
      
      const timeRemaining = getTokenTimeRemaining();
      
      // CASE 1: Token đã hết hạn
      if (timeRemaining <= 0) {
        try {
          await refreshToken();
          store.dispatch(fetchCurrentUser());
        } catch (error) {
          console.error('Refresh token thất bại:', error);
          removeTokens();
          // Redirect về login nếu không phải TokenTester page
          if (!window.location.pathname.includes('/token-tester')) {
            const authType = localStorage.getItem('authType') || 'user';
            window.location.href = authType === 'seller' ? '/seller' : '/login';
          }
        }
        return;
      }
      
      // CASE 2: Token sắp hết hạn (còn dưới 5 phút)
      if (timeRemaining < REFRESH_THRESHOLD) {
        try {
          await refreshToken();
          store.dispatch(fetchCurrentUser());
        } catch (error) {
          console.error('Lỗi khi refresh token proactively:', error);
          // Không xóa token nếu chỉ là lỗi mạng
          if (error.response?.status === 401 || error.response?.status === 403) {
            removeTokens();
            if (!window.location.pathname.includes('/token-tester')) {
              const authType = localStorage.getItem('authType') || 'user';
              window.location.href = authType === 'seller' ? '/seller' : '/login';
            }
          }
        }
        return;
      }
      
      // Chỉ cập nhật Redux store từ localStorage
      store.dispatch(fetchCurrentUser());
      
    } catch (error) {
      console.error('Lỗi khi kiểm tra token lúc khởi động:', error);
    }
    
  };
  
  // Chạy ngay lập tức khi init (reload page)
  checkAndRefreshOnInit();
  
  // Thiết lập kiểm tra liên tục mỗi 30 giây
  window.tokenRefreshInterval = setInterval(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      const timeRemaining = getTokenTimeRemaining();
      
      // Refresh nếu token sắp hết hạn hoặc đã hết hạn
      if (timeRemaining <= 0) {
        await refreshToken();
        store.dispatch(fetchCurrentUser());
      } else if (timeRemaining < REFRESH_THRESHOLD) {
        await refreshToken();
        store.dispatch(fetchCurrentUser());
      }
    } catch (error) {
      console.error('Lỗi khi tự động refresh token:', error);
      
      // Thử lại sau 10 giây nếu gặp lỗi
      setTimeout(async () => {
        try {
          const timeRemaining = getTokenTimeRemaining();
          if (timeRemaining < REFRESH_THRESHOLD) {
            await refreshToken();
            store.dispatch(fetchCurrentUser());
          }
        } catch (retryError) {
        }
      }, 10000);
    }
  }, 30000); // Kiểm tra mỗi 30 giây
  
  // Thiết lập tự động refresh khi tab được kích hoạt lại
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        
        const timeRemaining = getTokenTimeRemaining();
        
        // Ngưỡng cao hơn khi quay lại tab (10 phút)
        if (timeRemaining <= 0) {
          await refreshToken();
          store.dispatch(fetchCurrentUser());
        } else if (timeRemaining < REFRESH_THRESHOLD * 2) {
          await refreshToken();
          store.dispatch(fetchCurrentUser());
        }
      } catch (error) {
        console.error('Lỗi khi refresh token sau khi kích hoạt tab:', error);
      }
    }
  };
  
  // Thêm event listener cho visibility change
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  
  // Trả về cleanup function tổng hợp
  return () => {
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Request interceptor - Tự động thêm Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Xử lý refresh token khi 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Không can thiệp refresh chính nó
    if (originalRequest?.url?.includes("/api/auth/refresh-token")) {
      return Promise.reject(error);
    }

    // 401 => thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const expiredMsg = (error.response.data?.message || "").toLowerCase();
      if (
        !expiredMsg.includes("expired") &&
        !expiredMsg.includes("jwt") &&
        !expiredMsg.includes("token") &&
        !expiredMsg.includes("không hợp lệ")
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addSubscriber((token) => {
            if (!token) return reject(error);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const rToken = getRefreshToken();

        if (!rToken) throw new Error("No refresh token");
        
        const resp = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/auth/refresh-token`,
          { refreshToken: rToken }, 
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        const data = resp.data?.data || {};
        const newAccess = data.accessToken || data.access_token || data.token || null;
        const newRefresh = data.refreshToken || data.refresh_token || null;
        const userData = data.user || null;

        if (!newAccess) throw new Error("No access token in refresh response");

        // Lưu user data mới
        if (userData) {
          localStorage.setItem('user', JSON.stringify(userData));
        }

        setTokens(newAccess, newRefresh);
        store.dispatch(fetchCurrentUser());
        processSubscribers(newAccess);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (e) {
        console.error("Lỗi khi refresh token:", e.message);
        processSubscribers(null);
        isRefreshing = false;

        const isTokenTester = window.location.pathname.includes("/token-tester");

        if (!isTokenTester) {
          if (e.response && (e.response.status === 401 || e.response.status === 403)) {
            removeTokens();

            const authType = localStorage.getItem("authType") || "user";
            if (authType === "seller") {
              if (window.location.pathname !== "/seller")
                window.location.href = "/seller";
            } else {
              if (window.location.pathname !== "/login")
                window.location.href = "/login";
            }
          } else {
          }
        } else {
          removeTokens();
        }

        return Promise.reject(e);
      }
    }

    // Retry logic cho lỗi mạng hoặc timeout
    if (
      (error.code === "ECONNABORTED" ||
        error.message.includes("timeout") ||
        (!error.response && error.request)) &&
      !originalRequest._retryCount
    ) {
      if (!originalRequest._retryCount) originalRequest._retryCount = 0;

      if (originalRequest._retryCount < MAX_RETRIES) {
        originalRequest._retryCount++;
        const delay = 1000 * Math.pow(2, originalRequest._retryCount - 1);

        return new Promise((resolve) => {
          setTimeout(() => resolve(api(originalRequest)), delay);
        });
      }
    }

    return Promise.reject(error);
  }
);

// Hàm tiện ích để xử lý các lỗi API
export const handleApiError = (error) => {
  let errorMessage = "Có lỗi xảy ra, vui lòng thử lại sau.";

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (status === 400) {
      errorMessage = data.message || "Yêu cầu không hợp lệ";
    } else if (status === 401) {
      errorMessage = "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại";
    } else if (status === 403) {
      errorMessage = "Bạn không có quyền thực hiện hành động này";
    } else if (status === 404) {
      errorMessage = "Không tìm thấy tài nguyên yêu cầu";
    } else if (status === 500) {
      errorMessage = "Lỗi máy chủ, vui lòng thử lại sau";
    }

    if (data && data.message) {
      errorMessage = data.message;
    }
  } else if (error.request) {
    errorMessage = "Không thể kết nối tới máy chủ, vui lòng kiểm tra kết nối mạng";
  }

  return {
    message: errorMessage,
    originalError: error,
  };
};

// Khởi tạo auth header khi app mới load
const initialToken = getAccessToken();
if (initialToken) {
  setAuthHeader(initialToken);
  // Redux: Cập nhật trạng thái ban đầu từ localStorage
  store.dispatch(fetchCurrentUser());
}

export default api;