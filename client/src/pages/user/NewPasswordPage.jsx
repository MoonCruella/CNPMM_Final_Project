import React, { useState } from "react";
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
  const email = location.state?.email; // từ VerifyOTPPage
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      resetPasswordSchema.parse({ password, confirmPassword });
      setLoading(true);

      const res = await authService.resetPassword(email, password);

      setLoading(false);
      if (res.data.success) {
        toast.success(res.data.message || "Đặt lại mật khẩu thành công");
        navigate("/login");
      } else {
        toast.error(res.data.message || "Đặt lại mật khẩu thất bại");
      }
    } catch (error) {
      setLoading(false);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || "Có lỗi xảy ra, thử lại!");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="mb-4 text-center text-2xl font-bold text-black">
          Đặt lại mật khẩu
        </h2>
        <p className="mb-6 text-center text-gray-500">
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-green-400 bg-green-50 p-3 text-gray-700 focus:border-green-600 focus:ring-2 focus:ring-green-400"
          />
          <input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-green-400 bg-green-50 p-3 text-gray-700 focus:border-green-600 focus:ring-2 focus:ring-green-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold shadow-md transition hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPasswordPage;
