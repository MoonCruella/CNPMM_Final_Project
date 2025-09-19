import api from "./api";

const authService = {
  // Token Management
  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  getAccessToken: () => localStorage.getItem("accessToken"),
  getRefreshToken: () => localStorage.getItem("refreshToken"),

  removeTokens: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  // User Management
  setUser: (userData) => {
    const normalizedUser = {
      ...userData,
      _id: userData._id || userData.userId || userData.id,
    };
    localStorage.setItem("user", JSON.stringify(normalizedUser));
  },

  getUser: () => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  },

  // Token Utilities
  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  },

  decodeToken: (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch (error) {
      return null;
    }
  },

  // ✅ Fixed getCurrentUser - Correct response structure
  getCurrentUser: async () => {
    try {
      const res = await api.get("/api/auth/get-user");

      // ✅ Based on your actual response: { status: true, user: {...} }
      if (res.data && res.data.status === true && res.data.user) {
        const apiUser = res.data.user;

        // Normalize user data from API
        const normalizedUser = {
          _id: apiUser.userId, // Backend uses userId
          name: apiUser.name || apiUser.email?.split("@")[0] || "User",
          email: apiUser.email,
          role: apiUser.role || "user",
          active: apiUser.active,
          coin: apiUser.coin || 0,
          username: apiUser.username || null,
          phone: apiUser.phone || null,
          date_of_birth: apiUser.date_of_birth || null,
          gender: apiUser.gender || null,
          address: apiUser.address || {},
          avatar: apiUser.avatar || null,
          createdAt: apiUser.createdAt || null,
          updatedAt: apiUser.updatedAt || null,
          last_login: apiUser.last_login || null,
          // Store JWT fields for reference
          exp: apiUser.exp,
          iat: apiUser.iat,
        };

        // Validate required fields
        if (!normalizedUser._id || !normalizedUser.email) {
          throw new Error("Missing required user fields: _id or email");
        }

        // Save to localStorage
        authService.setUser(normalizedUser);
        return res;
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      console.error("getCurrentUser error:", error);
      throw error;
    }
  },

  // ✅ Updated login with better error handling
  login: async (email, password) => {
    try {
      const res = await api.post("/api/auth/login", { email, password });

      if (res.data.success) {
        const { accessToken, refreshToken } = res.data.data;

        // 1. Save tokens first
        authService.setTokens(accessToken, refreshToken);

        // 2. Try to fetch complete user data from API
        try {
          await authService.getCurrentUser();
        } catch (getUserError) {
          console.error("getCurrentUser failed after login:", getUserError);

          // ✅ Fallback: Extract user data from login response or JWT
          let fallbackUser = null;

          // Try from login response first
          if (res.data.data.user) {
            const loginUser = res.data.data.user;
            fallbackUser = {
              _id: loginUser._id || loginUser.userId || loginUser.id,
              name: loginUser.name || loginUser.email?.split("@")[0] || "User",
              email: loginUser.email,
              role: loginUser.role || "user",
              coin: loginUser.coin || 0,
              active: loginUser.active !== false,
              username: loginUser.username || null,
              phone: loginUser.phone || null,
              date_of_birth: loginUser.date_of_birth || null,
              gender: loginUser.gender || null,
              address: loginUser.address || {},
              avatar: loginUser.avatar || null,
            };
          }
          // Fallback to JWT token
          else {
            const tokenPayload = authService.decodeToken(accessToken);
            if (tokenPayload) {
              fallbackUser = {
                _id: tokenPayload.userId || tokenPayload.id,
                name:
                  tokenPayload.name ||
                  tokenPayload.email?.split("@")[0] ||
                  "User",
                email: tokenPayload.email,
                coin: tokenPayload.coin || 0,
                role: tokenPayload.role || "user",
                active: tokenPayload.active !== false,
                username: tokenPayload.username || null,
                phone: tokenPayload.phone || null,
                exp: tokenPayload.exp,
                iat: tokenPayload.iat,
              };
            }
          }

          if (fallbackUser && fallbackUser._id) {
            authService.setUser(fallbackUser);
            console.log("Used fallback user data");
          } else {
            authService.removeTokens();
            throw new Error("Could not retrieve user data after login");
          }
        }

        return res;
      } else {
        throw new Error(res.data.message || "Login failed");
      }
    } catch (error) {
      authService.removeTokens();
      throw error;
    }
  },

  register: async (values) => {
    return await api.post("/api/auth/register", values);
  },

  refreshToken: async () => {
    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");

    try {
      const res = await api.post("/api/auth/refresh-token", { refreshToken });

      if (res.data.success) {
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        // Save new tokens
        authService.setTokens(accessToken, newRefreshToken);

        // Try to fetch updated user data
        try {
          await authService.getCurrentUser();
        } catch (getUserError) {
          console.error(
            "getCurrentUser failed after token refresh:",
            getUserError
          );
          // Continue with existing user data - don't throw error
        }

        return accessToken;
      } else {
        authService.removeTokens();
        throw new Error(res.data.message || "Token refresh failed");
      }
    } catch (error) {
      authService.removeTokens();
      throw error;
    }
  },

  logout: async () => {
    try {
      const refreshToken = authService.getRefreshToken();
      if (refreshToken) {
        await api.post("/api/auth/logout", { refreshToken });
      }
    } catch (error) {
      // Silent fail
    } finally {
      authService.removeTokens();
    }
  },

  logoutAll: async () => {
    try {
      await api.post("/api/auth/logout-all");
    } catch (error) {
      // Silent fail
    } finally {
      authService.removeTokens();
    }
  },

  updateUserProfile: async (userId, userData) => {
    try {
      const res = await api.put(`/api/users/profile/${userId}`, userData);

      if (res.data.success) {
        // Try to refresh user data from server after update
        try {
          await authService.getCurrentUser();
        } catch (getUserError) {
          console.error(
            "getCurrentUser failed after profile update:",
            getUserError
          );
          // Fallback: update local storage with provided data
          const currentUser = authService.getUser();
          if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            authService.setUser(updatedUser);
          }
        }
      }

      return res;
    } catch (error) {
      throw error;
    }
  },

  // OTP Methods
  resendOtpRegister: async (email) => {
    return await api.post("/api/auth/register/resend-otp", { email });
  },

  verifyOtpRegister: async (email, otp) => {
    return await api.post("/api/auth/register/verify-otp", { email, otp });
  },

  sendOtpForgotPassword: async (email) => {
    return await api.post("/api/auth/forgot-password/send-otp", { email });
  },

  verifyOtpForgotPassword: async (email, otp) => {
    return await api.post("/api/auth/forgot-password/verify-otp", {
      email,
      otp,
    });
  },

  resetPassword: async (email, newPassword) => {
    return await api.post("/api/auth/forgot-password/reset", {
      email,
      newPassword,
    });
  },
};

export default authService;
