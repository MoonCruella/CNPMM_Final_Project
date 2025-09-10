import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // lấy từ .env
  withCredentials: true, // gửi cookie/session
  headers: {
    "Content-Type": "application/json",
  },
});
let isRefreshing = false;
let refreshSubscribers = [];

// Helper functions cho token management
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");
const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
};
const removeTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh token, thêm request vào queue
        return new Promise((resolve, reject) => {
          addSubscriber((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh token API
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // Lưu token mới
        setTokens(accessToken, newRefreshToken);

        // Cập nhật header cho request gốc
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Thực hiện tất cả request đang chờ
        processSubscribers(accessToken);

        isRefreshing = false;

        // Retry request gốc
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processSubscribers(null);

        // Refresh token thất bại, xóa tokens và redirect login
        removeTokens();

        const authType = localStorage.getItem("authType") || "user";

        if (authType === "seller") {
          if (window.location.pathname !== "/seller") {
            window.location.href = "/seller";
          }
        } else {
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export default api;
