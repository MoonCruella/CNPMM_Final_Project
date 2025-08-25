import api from "./api";

const authService = {
  // --- Login ---
  login: async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    return res;
  },

  // --- Register ---
  register: async (values) => {
    const res = await api.post("/api/auth/register", values);
    return res;
  },
  resendOtpRegister: async (email) => {
    const res = await api.post("/api/auth/register/resend-otp", { email });
    return res;
  },
  verifyOtpRegister: async (email, otp) => {
    const res = await api.post("/api/auth/register/verify-otp", { email, otp });
    return res;
  },

  // --- Forgot Password ---
  sendOtpForgotPassword: async (email) => {
    const res = await api.post("/api/auth/forgot-password/send-otp", { email });
    return res;
  },
  verifyOtpForgotPassword: async (email, otp) => {
    const res = await api.post("/api/auth/forgot-password/verify-otp", {
      email,
      otp,
    });
    return res;
  },
  resetPassword: async (email, newPassword) => {
    const res = await api.post("/api/auth/forgot-password/reset", {
      email,
      newPassword,
    });
    return res;
  },
};

export default authService;
