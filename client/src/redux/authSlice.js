import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Tránh circular dependency
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const getAccessToken = () => localStorage.getItem("accessToken");

// Helper function để đảm bảo dữ liệu serializable
const sanitizeUserData = (userData) => {
  if (!userData) return null;

  if (userData.data) {
    userData = userData.data;
  }

  // Loại bỏ các thuộc tính không serializable
  const sanitized = { ...userData };
  delete sanitized.headers;
  delete sanitized.config;
  delete sanitized.request;

  return {
    _id: sanitized._id || sanitized.userId || sanitized.id,
    email: sanitized.email,
    role: sanitized.role || "user",
    full_name: sanitized.full_name || sanitized.name || "",
    phone: sanitized.phone || "",
    avatar: sanitized.avatar || null,
    active: sanitized.active || false,
    gender: sanitized.gender || null,
    coin: sanitized.coin || 0,
    date_of_birth: sanitized.date_of_birth || null,
    accessToken: localStorage.getItem("accessToken"),
    createdAt: sanitized.createdAt || null,
    updatedAt: sanitized.updatedAt || null,
  };
};

// Function để xóa dữ liệu auth
const removeAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

// Async thunk để login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      if (response.data.success) {
        const { accessToken, refreshToken } = response.data.data;

        // Lưu tokens NGAY LẬP TỨC
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        // Lấy thông tin user
        const userResponse = await axios.get(
          `${API_BASE_URL}/api/auth/get-user`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const userData = userResponse.data.user || userResponse.data.data;
        localStorage.setItem("user", JSON.stringify(userData));

        const sanitizedUser = sanitizeUserData(userData);

        return {
          ...sanitizedUser,
          accessToken,
          refreshToken,
        };
      }
      return rejectWithValue(response.data.message || "Login failed");
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk cho seller login
export const loginSeller = createAsyncThunk(
  "auth/loginSeller",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        const { accessToken, refreshToken } = response.data.data;

        // Lưu tokens NGAY LẬP TỨC
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        const userResponse = await axios.get(
          `${API_BASE_URL}/api/auth/get-user`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const userData = userResponse.data.user || userResponse.data.data;

        // Kiểm tra role
        if (userData.role !== "seller") {
          removeAuthData();
          return rejectWithValue("Không phải tài khoản người bán");
        }

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("authType", "seller");

        const sanitizedUser = sanitizeUserData(userData);

        return {
          ...sanitizedUser,
          accessToken,
          refreshToken,
        };
      }
      return rejectWithValue(response.data.message || "Login failed");
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk để lấy thông tin user hiện tại
export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = getAccessToken();
      if (!accessToken) return null;

      const response = await axios.get(`${API_BASE_URL}/api/auth/get-user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = response.data.user || response.data.data;
      localStorage.setItem("user", JSON.stringify(userData));

      // Trả về userData kèm accessToken
      const sanitizedUser = sanitizeUserData(userData);
      return {
        ...sanitizedUser,
        accessToken,
      };
    } catch (error) {
      console.error("getCurrentUser error:", error);
      if (error.response?.status === 401) {
        // Token không hợp lệ, xóa dữ liệu auth
        removeAuthData();
      }
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk để logout
export const logoutAsync = createAsyncThunk(
  "auth/logoutAsync",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = getAccessToken();
      if (accessToken) {
        await axios.post(
          `${API_BASE_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
      removeAuthData();
      return true;
    } catch (error) {
      // Vẫn xóa dữ liệu auth dù có lỗi
      removeAuthData();
      return rejectWithValue(error.message);
    }
  }
);

// Khởi tạo trạng thái từ localStorage nếu có
const getUserFromStorage = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? sanitizeUserData(JSON.parse(user)) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

const initialState = {
  user: getUserFromStorage(),
  accessToken: localStorage.getItem("accessToken"),
  isAuthenticated: !!getAccessToken(),
  isSeller: getUserFromStorage()?.role === "seller",
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isSeller = false;
      removeAuthData();
    },
    updateToken: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
        state.accessToken = accessToken;
        state.isAuthenticated = true;
      }
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
    },
    setUser: (state, action) => {
      const userData = sanitizeUserData(action.payload);
      state.user = userData;
      state.isAuthenticated = true;
      state.isSeller = userData?.role === "seller";
      localStorage.setItem("user", JSON.stringify(userData));
    },
  },
  extraReducers: (builder) => {
    // Login cases
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.user = action.payload;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isSeller = action.payload.role === "seller";
      state.loading = false;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Seller login cases
    builder.addCase(loginSeller.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginSeller.fulfilled, (state, action) => {
      state.user = action.payload;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isSeller = true;
      state.loading = false;
    });
    builder.addCase(loginSeller.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Fetch current user cases
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isSeller = action.payload.role === "seller";
      }
      state.loading = false;
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
    });

    // Logout cases
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isSeller = false;
    });
  },
});

export const { clearError, logout, updateToken, setUser } = authSlice.actions;
export default authSlice.reducer;
