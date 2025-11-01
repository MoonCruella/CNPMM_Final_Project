import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { toast } from "sonner";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z
      .string()
      .min(8, "Xác nhận mật khẩu phải có ít nhất 8 ký tự"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu và xác nhận mật khẩu phải trùng khớp",
    path: ["confirmPassword"],
  });

const NewPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { email, mode: stateMode } = location.state || {};
  
  const mode = stateMode || (location.pathname.includes("change-password") 
    ? "change-password" 
    : "forgot-password");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error("Thông tin không hợp lệ");
      navigate("/login");
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Validate password
      resetPasswordSchema.parse({ password, confirmPassword });

      setLoading(true);

      let res;
      if (mode === "forgot-password") {
        res = await authService.resetPassword(email, password);
      } else if (mode === "change-password") {
        res = await authService.changePassword(email, password);
      }

      setLoading(false);

      if (res.data.success) {
        toast.success(
          mode === "forgot-password"
            ? "Đặt lại mật khẩu thành công!"
            : "Đổi mật khẩu thành công!"
        );
        
        setTimeout(() => {
          if (mode === "forgot-password") {
            navigate("/login");
          } else {
            navigate("/user/account/profile");
          }
        }, 2000);
      } else {
        toast.error(res.data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      setLoading(false);

      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        const message = error.response?.data?.message || "Có lỗi xảy ra";
        toast.error(message);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-md">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="mt-4 text-center text-2xl font-bold text-black">
            {mode === "forgot-password" ? "Đặt lại mật khẩu" : "Đổi mật khẩu"}
          </h2>
          <p className="mt-2 text-center text-gray-500">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-green-400 bg-green-50 p-3 pr-12 text-gray-700 focus:border-green-600 focus:ring-2 focus:ring-green-400 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-2xl hover:scale-110 transition"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-green-400 bg-green-50 p-3 text-gray-700 focus:border-green-600 focus:ring-2 focus:ring-green-400 focus:outline-none"
              required
            />
          </div>

          {/* Password strength indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className={`h-2 flex-1 rounded transition-all ${password.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div className={`h-2 flex-1 rounded transition-all ${password.length >= 10 ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div className={`h-2 flex-1 rounded transition-all ${/[A-Z]/.test(password) && /[0-9]/.test(password) ? "bg-green-500" : "bg-gray-300"}`}></div>
              </div>
              <p className="text-xs text-gray-600">
                {password.length < 8 && "⚠️ Mật khẩu cần ít nhất 8 ký tự"}
                {password.length >= 8 && password.length < 10 && "✓ Mật khẩu trung bình"}
                {password.length >= 10 && !/[A-Z]/.test(password) && "✓ Mật khẩu khá - Thêm chữ hoa để mạnh hơn"}
                {password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) && "✓ Mật khẩu mạnh"}
              </p>
            </div>
          )}

          {/* Password match */}
          {confirmPassword && (
            <div className="text-xs">
              {password === confirmPassword ? (
                <p className="text-green-600">✓ Mật khẩu khớp</p>
              ) : (
                <p className="text-red-600">✗ Mật khẩu không khớp</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || password.length < 8 || password !== confirmPassword}
            className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold shadow-md transition hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang xử lý...</span>
              </div>
            ) : (
              mode === "forgot-password" ? "Đặt lại mật khẩu" : "Đổi mật khẩu"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPasswordPage;