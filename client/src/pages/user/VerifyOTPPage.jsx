import React, { useState, useRef } from "react";
import authService from "../../services/authService";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { toast, Toaster } from "sonner";

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { email, mode } = location.state;
  const inputsRef = useRef([]);
  const navigate = useNavigate();

  const handleChange = (val, i) => {
    if (/^[0-9]$/.test(val) || val === "") {
      const newOtp = [...otp];
      newOtp[i] = val;
      setOtp(newOtp);

      if (val !== "" && i < 5) {
        inputsRef.current[i + 1].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join(""); // giả sử otp là mảng 6 chữ số
    try {
      setLoading(true);
      let res;
      if (mode === "register") {
        res = await authService.verifyOtpRegister(email, otpCode);
      } else {
        res = await authService.verifyOtpForgotPassword(email, otpCode);
      }
      setLoading(false);

      if (res.data.success) {
        toast.success(res.data.message);
        navigate(mode === "register" ? "/login" : "/reset-password", {
          state: { email },
        });
      } else {
        toast.error(res.data.message || "Xác thực OTP thất bại");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(
        error.response?.data?.message || "Xảy ra lỗi, vui lòng thử lại!"
      );
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      let res;
      if (mode === "register") {
        res = await authService.resendOtpRegister(email);
      } else {
        res = await authService.sendOtpForgotPassword(email);
      }
      setLoading(false);
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message || "Xác thực OTP thất bại");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(
        error.response?.data?.message || "Xảy ra lỗi, vui lòng thử lại!"
      );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="mb-4 text-center text-2xl font-bold text-black">
          {mode === "register"
            ? "Xác thực OTP để hoàn tất đăng ký"
            : "Xác thực OTP để đặt lại mật khẩu"}
        </h2>
        <p className="mb-6 text-center text-gray-500">
          Nhập mã OTP đã được gửi tới email của bạn
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputsRef.current[i] = el)}
                className="h-12 w-12 rounded-lg border border-green-400 bg-green-50 text-center text-lg font-semibold text-green-700 focus:border-green-600 focus:ring-2 focus:ring-green-400"
                onChange={(e) => handleChange(e.target.value, i)}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold shadow-md transition hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-500">
          <p>
            Không nhận được mã?{" "}
            <button
              onClick={handleResend}
              disabled={loading}
              className="font-semibold text-green-600 hover:underline disabled:opacity-50"
            >
              Gửi lại OTP
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
