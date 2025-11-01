import React, { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import authService from "../../services/authService";

const changePasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

const ChangePasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Get current user email from localStorage
  React.useEffect(() => {
    const user = authService.getUser();
    if (user && user.email) {
      setEmail(user.email);
    } else {
      toast.error("Vui lòng đăng nhập để đổi mật khẩu");
      navigate("/login");
    }
  }, [navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      // Validate email
      changePasswordSchema.parse({ email });

      setIsLoading(true);
      const res = await authService.sendOtpChangePassword(email);
      setIsLoading(false);

      // Kiểm tra success từ response
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/verify-otp", { state: { email, mode: "change-password" } });
      } else {
        toast.error(
          res.data.message || "Có lỗi xảy ra khi gửi OTP"
        );
      }
    } catch (error) {
      setIsLoading(false);

      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";

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
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            Đổi mật khẩu
          </h1>
          <p className="text-gray-500 text-center mt-2">
            Xác nhận email để nhận mã OTP đổi mật khẩu
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 pl-12 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-gray-50"
                placeholder="VD: demo@quehuong.vn"
                value={email}
                readOnly
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Email của tài khoản hiện tại
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          <Link
            to="/profile"
            className="text-blue-600 hover:underline font-semibold"
          >
            ← Quay lại trang cá nhân
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ChangePasswordPage;