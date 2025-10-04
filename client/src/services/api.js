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

// Thiết lập tự động refresh token
export const setupAutoRefresh = () => {
  console.log('🔄 Đã thiết lập tự động refresh token');
  
  // Xóa interval cũ nếu có
  if (window.tokenRefreshInterval) {
    clearInterval(window.tokenRefreshInterval);
  }
  
  // Kiểm tra và refresh token mỗi phút
  window.tokenRefreshInterval = setInterval(async () => {
    try {
      // Nếu không có token, không làm gì
      if (!localStorage.getItem('accessToken')) return;
      
      const timeRemaining = getTokenTimeRemaining();
      // Refresh token khi còn dưới 5 phút
      const REFRESH_THRESHOLD = 5 * 60 * 1000;
      
      if (timeRemaining > 0 && timeRemaining < REFRESH_THRESHOLD) {
        console.log(`Token sắp hết hạn (còn ${Math.round(timeRemaining/60000)} phút), đang refresh...`);
        await refreshToken();
        console.log('Token đã được refresh tự động');
        store.dispatch(fetchCurrentUser());
      }
    } catch (error) {
      console.error('Lỗi khi tự động refresh token:', error);
    }
  }, 60000); // Kiểm tra mỗi phút
  
  // Trả về cleanup function
  return () => {
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
      console.log('Đã tắt tự động refresh token');
    }
  };
};

// Thiết lập tự động refresh khi tab được kích hoạt lại
export const setupVisibilityRefresh = () => {
  const handleVisibilityChange = async () => {
    if (document.visibilityState === 'visible') {
      try {
        // Nếu không có token, không làm gì
        if (!localStorage.getItem('accessToken')) return;
        
        const timeRemaining = getTokenTimeRemaining();
        // Refresh token khi còn dưới 10 phút
        const REFRESH_THRESHOLD = 10 * 60 * 1000;
        
        if (timeRemaining > 0 && timeRemaining < REFRESH_THRESHOLD) {
          console.log(`Tab được kích hoạt lại, token còn ${Math.round(timeRemaining/60000)} phút, đang refresh...`);
          await refreshToken();
          console.log('Token đã được refresh khi kích hoạt tab');
          store.dispatch(fetchCurrentUser());
        }
      } catch (error) {
        console.error('Lỗi khi refresh token sau khi kích hoạt tab:', error);
      }
    }
  };
  
  // Thêm event listener
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Trả về cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
};

// Khởi tạo hệ thống refresh token
export const initTokenRefresh = () => {
  const autoRefreshCleanup = setupAutoRefresh();
  const visibilityRefreshCleanup = setupVisibilityRefresh();
  
  // Kiểm tra token ngay khi khởi động
  setTimeout(async () => {
    if (localStorage.getItem('accessToken')) {
      const timeRemaining = getTokenTimeRemaining();
      // Refresh token khi còn dưới 10 phút
      const REFRESH_THRESHOLD = 10 * 60 * 1000;
      
      if (timeRemaining > 0 && timeRemaining < REFRESH_THRESHOLD) {
        console.log(`Khởi động ứng dụng, token còn ${Math.round(timeRemaining/60000)} phút, đang refresh...`);
        try {
          await refreshToken();
          console.log('Token đã được refresh khi khởi động');
          
          // Redux: Cập nhật user data sau khi refresh token
          store.dispatch(fetchCurrentUser());
        } catch (error) {
          console.error('Lỗi khi refresh token khi khởi động:', error);
        }
      } else if (timeRemaining > 0) {
        // Redux: Cập nhật Redux store từ localStorage
        store.dispatch(fetchCurrentUser());
      }
    }
  }, 1000);
  
  // Trả về cleanup function tổng hợp
  return () => {
    autoRefreshCleanup();
    visibilityRefreshCleanup();
  };
};



// Hàm proactively refresh token trước khi hết hạn
export const setupTokenRefreshInterval = (minimumValidTime = 5 * 60 * 1000) => {
  // Clear any existing interval
  if (window.tokenRefreshInterval) {
    clearInterval(window.tokenRefreshInterval);
  }

  // Setup interval to check token
  window.tokenRefreshInterval = setInterval(async () => {
    const timeRemaining = getTokenTimeRemaining();

    // Nếu token sắp hết hạn (còn dưới minimumValidTime ms), refresh
    if (timeRemaining > 0 && timeRemaining < minimumValidTime) {
      try {
        await refreshToken();
        console.log("Token refreshed proactively");
        store.dispatch(fetchCurrentUser());
      } catch (error) {
        console.error("Failed to refresh token proactively:", error);
      }
    }
  }, 60000); // Kiểm tra mỗi phút

  // Clean up khi component unmount
  return () => {
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
    }
  };
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
    console.log(rToken);
    if (!rToken) throw new Error("No refresh token available");

    const resp = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token`,
      { refreshToken: rToken },
      { headers: { "Content-Type": "application/json" }, withCredentials: true }
    );

    const data = resp.data?.data || {};
    const newAccess = data.accessToken || data.token || null;
    const newRefresh = data.refreshToken || null;

    if (!newAccess) throw new Error("No access token in refresh response");

    setTokens(newAccess, newRefresh);
    processSubscribers(newAccess);
    isRefreshing = false;

    return newAccess;
  } catch (error) {
    processSubscribers(null);
    isRefreshing = false;
    throw error;
  }
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
        console.log("Refresh token available:", !!rToken);

        if (!rToken) throw new Error("No refresh token");
        const resp = await axios.post(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
          }/api/auth/refresh-token`,
          { refreshToken: rToken }, 
          {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          }
        );

        // Hỗ trợ cả 2 kiểu tên field
        const data = resp.data?.data || {};
        const newAccess =
          data.accessToken || data.access_token || data.token || null;
        const newRefresh = data.refreshToken || data.refresh_token || null;

        if (!newAccess) throw new Error("No access token in refresh response");

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

        // Kiểm tra nếu đang ở trang TokenTester thì không logout
        const isTokenTester =
          window.location.pathname.includes("/token-tester");

        if (!isTokenTester) {
          // Chỉ xóa tokens và redirect nếu là lỗi xác thực từ server
          if (
            e.response &&
            (e.response.status === 401 || e.response.status === 403)
          ) {
            console.log("Lỗi xác thực từ server, tiến hành logout");
            removeTokens();

            // Redirect dựa vào loại người dùng
            const authType = localStorage.getItem("authType") || "user";
            if (authType === "seller") {
              if (window.location.pathname !== "/seller")
                window.location.href = "/seller";
            } else {
              if (window.location.pathname !== "/login")
                window.location.href = "/login";
            }
          } else {
            // Nếu là lỗi mạng, không xóa tokens
            console.log("Lỗi không liên quan đến xác thực, giữ nguyên tokens");
          }
        } else {
          // Nếu ở trang TokenTester, chỉ xóa tokens nhưng không redirect
          console.log(
            "Đang ở trang TokenTester, chỉ xóa tokens không redirect"
          );
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
        // Exponential backoff
        const delay = 1000 * Math.pow(2, originalRequest._retryCount - 1);

        console.log(`Retry #${originalRequest._retryCount} sau ${delay}ms...`);
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
    // Lỗi từ server (response có status)
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

    // Ưu tiên lấy message từ response nếu có
    if (data && data.message) {
      errorMessage = data.message;
    }
  } else if (error.request) {
    // Request được gửi nhưng không nhận được response
    errorMessage =
      "Không thể kết nối tới máy chủ, vui lòng kiểm tra kết nối mạng";
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
