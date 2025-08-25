import React, { useState } from "react";
import { z } from "zod";
import { toast, Toaster } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .nonempty("Email hoặc số điện thoại không được để trống")
    .regex(
      /^(?:\S+@\S+\.\S+|\d{10})$/,
      "Email hoặc số điện thoại không hợp lệ"
    ),
});

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      // Validate email
      forgotPasswordSchema.parse({ email });

      setIsLoading(true);
      const res = await authService.forgotPassword(email);
      setIsLoading(false);

      // Kiểm tra success từ response
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/verify-otp", { state: { email, mode: "forgot-password" } });
      } else {
        toast.error(
          res.data.message || "Không tìm thấy tài khoản với thông tin này."
        );
      }
    } catch (error) {
      setIsLoading(false);

      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.response) {
        // Xử lý theo status code của backend
        const status = error.response.status;
        const message =
          error.response.data?.message || "Có lỗi xảy ra, vui lòng thử lại!";

        if (status === 429) {
          toast.error(message); // Quá số lần gửi OTP
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
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-md">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
              <path d="M12 16C12 16 8 20 8 22C8 23.1 8.9 24 10 24H14C15.1 24 16 23.1 16 22C16 20 12 16 12 16Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            Quên mật khẩu?
          </h1>
          <p className="text-gray-500 text-center mt-2">
            Nhập email hoặc số điện thoại để nhận liên kết đặt lại mật khẩu
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email hoặc số điện thoại
            </label>
            <div className="relative">
              <input
                id="email"
                type="text"
                className="w-full px-4 py-3 pl-12 border rounded-xl focus:ring-2 focus:ring-green-500 focus:outline-none"
                placeholder="VD: demo@quehuong.vn hoặc 0123456789"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
                  1.79-4 4 1.79 4 4 4zm0 2c-2.67 
                  0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            {isLoading ? "Đang gửi..." : "Gửi liên kết đặt lại mật khẩu"}
          </button>
        </form>

        {/* Link quay lại login */}
        <p className="mt-6 text-center text-gray-600">
          Nhớ mật khẩu rồi?{" "}
          <Link
            to="/login"
            className="text-green-600 hover:underline font-semibold"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
