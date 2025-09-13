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
};
const removeTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  setAuthHeader(null);
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
      if (!expiredMsg.includes("expired") && !expiredMsg.includes("jwt")) {
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

        // Gửi đúng key backend (refresh_token)
        const resp = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"}/api/auth/refresh-token`,
          { refresh_token: rToken },
          { headers: { "Content-Type": "application/json" }, withCredentials: true }
        );

        // Hỗ trợ cả 2 kiểu tên field
        const data = resp.data?.data || {};
        const newAccess =
          data.access_token || data.accessToken || data.token || null;
        const newRefresh =
          data.refresh_token || data.refreshToken || null;

        if (!newAccess) throw new Error("No access token in refresh response");

        setTokens(newAccess, newRefresh);
        processSubscribers(newAccess);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (e) {
        processSubscribers(null);
        removeTokens();
        isRefreshing = false;

        const authType = localStorage.getItem("authType") || "user";
        if (authType === "seller") {
          if (window.location.pathname !== "/seller") window.location.href = "/seller";
        } else {
          if (window.location.pathname !== "/login") window.location.href = "/login";
        }
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);
export default api;
