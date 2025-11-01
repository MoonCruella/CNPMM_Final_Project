import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import authService from "../../services/authService";

const passwordSchema = z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự");

const ResetPasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { email, mode } = location.state || {}; // mode: "forgot-password" or "change-password"
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email || !mode) {
      toast.error("Thông tin không hợp lệ");
      navigate("/login");
    }
  }, [email, mode, navigate]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      // Validate password
      passwordSchema.parse(newPassword);

      if (newPassword !== confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        return;
      }

      setIsLoading(true);

      let res;
      if (mode === "forgot-password") {
        res = await authService.resetPassword(email, newPassword);
      } else if (mode === "change-password") {
        if (!currentPassword) {
          toast.error("Vui lòng nhập mật khẩu hiện tại");
          setIsLoading(false);
          return;
        }
        res = await authService.changePassword(email, currentPassword, newPassword);
      }

      setIsLoading(false);

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
            navigate("/profile");
          }
        }, 2000);
      } else {
        toast.error(res.data.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      setIsLoading(false);

      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        const message = error.response?.data?.message || "Có lỗi xảy ra";
        toast.error(message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${
            mode === "forgot-password" ? "bg-green-600" : "bg-blue-600"
          }`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            {mode === "forgot-password" ? "Đặt lại mật khẩu" : "Đổi mật khẩu"}
          </h1>
          <p className="text-gray-500 text-center mt-2">
            {mode === "forgot-password" 
              ? "Tạo mật khẩu mới cho tài khoản" 
              : "Nhập mật khẩu hiện tại và mật khẩu mới"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* Current Password - Only for change-password mode */}
          {mode === "change-password" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Nhập mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl hover:scale-110 transition"
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
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {/* Password strength indicator */}
          {newPassword && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className={`h-2 flex-1 rounded transition-all ${newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div className={`h-2 flex-1 rounded transition-all ${newPassword.length >= 10 ? "bg-green-500" : "bg-gray-300"}`}></div>
                <div className={`h-2 flex-1 rounded transition-all ${/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`}></div>
              </div>
              <p className="text-xs text-gray-600">
                {newPassword.length < 8 && "⚠️ Mật khẩu cần ít nhất 8 ký tự"}
                {newPassword.length >= 8 && newPassword.length < 10 && "✓ Mật khẩu trung bình"}
                {newPassword.length >= 10 && !/[A-Z]/.test(newPassword) && "✓ Mật khẩu khá - Thêm chữ hoa để mạnh hơn"}
                {newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && "✓ Mật khẩu mạnh"}
              </p>
            </div>
          )}

          {/* Password match */}
          {confirmPassword && (
            <div className="text-xs">
              {newPassword === confirmPassword ? (
                <p className="text-green-600">✓ Mật khẩu khớp</p>
              ) : (
                <p className="text-red-600">✗ Mật khẩu không khớp</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || newPassword.length < 8 || newPassword !== confirmPassword}
            className={`w-full text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "forgot-password" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
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

export default ResetPasswordPage;