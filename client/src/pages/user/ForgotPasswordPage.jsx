import React, { useState, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Link, useNavigate, useLocation } from "react-router-dom";
import authService from "../../services/authService";

const emailSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Detect mode from URL pathname
  const mode = location.pathname.startsWith("/change-password") 
    ? "change-password" 
    : "forgot-password";

  // If change-password mode, get email from logged-in user
  useEffect(() => {
    if (mode === "change-password") {
      const user = authService.getUser();
      if (user && user.email) {
        setEmail(user.email);
      } else {
        toast.error("Vui lòng đăng nhập để đổi mật khẩu");
        navigate("/login");
      }
    }
  }, [mode, navigate]);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    try {
      // Validate email
      emailSchema.parse({ email });

      setIsLoading(true);

      let res;
      if (mode === "forgot-password") {
        res = await authService.sendOtpForgotPassword(email);
      } else if (mode === "change-password") {
        res = await authService.sendOtpChangePassword(email);
      }

      setIsLoading(false);

      if (res.data.success) {
        toast.success(res.data.message);
        navigate(`/${mode}/verify-otp`, { state: { email, mode } });
      } else {
        toast.error(res.data.message || "Có lỗi xảy ra khi gửi OTP");
      }
    } catch (error) {
      setIsLoading(false);

      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";

        if (status === 401) {
          toast.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
          navigate("/login");
        } else if (status === 429) {
          toast.error(message);
        } else {
          toast.error(message);
        }
      } else {
        toast.error("Có lỗi xảy ra, vui lòng thử lại!");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo / icon */}
        <div className="flex flex-col items-center mb-8">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-md ${
            mode === "forgot-password" ? "bg-green-600" : "bg-blue-600"
          }`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mode === "forgot-password" ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              )}
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            {mode === "forgot-password" ? "Quên mật khẩu?" : "Đổi mật khẩu"}
          </h1>
          <p className="text-gray-500 text-center mt-2">
            {mode === "forgot-password" 
              ? "Nhập email để nhận mã OTP đặt lại mật khẩu"
              : "Xác nhận email để nhận mã OTP đổi mật khẩu"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSendOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                className={`w-full px-4 py-3 pl-12 border rounded-xl focus:ring-2 focus:outline-none ${
                  mode === "forgot-password"
                    ? "focus:ring-green-500"
                    : "focus:ring-green-500 bg-gray-50"
                }`}
                placeholder="VD: demo@quehuong.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={mode === "change-password"}
                required
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>
            {mode === "change-password" && (
              <p className="text-xs text-gray-500 mt-2">
                Email của tài khoản hiện tại
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "forgot-password"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Đang gửi...</span>
              </div>
            ) : (
              "Gửi mã OTP"
            )}
          </button>
        </form>

        {/* Link quay lại */}
        <p className="mt-6 text-center text-gray-600">
          {mode === "forgot-password" ? (
            <>
              Nhớ mật khẩu rồi?{" "}
              <Link to="/login" className="text-green-600 hover:underline font-semibold">
                Đăng nhập ngay
              </Link>
            </>
          ) : (
            <Link to="/user/account/profile" className="text-green-600 hover:underline font-semibold">
              ← Quay lại trang cá nhân
            </Link>
          )}
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;