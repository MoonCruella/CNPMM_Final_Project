import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import authService from "../../services/authService";

const VerifyOtpPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { email, mode } = location.state || {}; // mode: "forgot-password" or "change-password"
  
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!email || !mode) {
      toast.error("Thông tin không hợp lệ");
      navigate("/login");
      return;
    }

    // Start countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, mode, navigate]);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error("Mã OTP phải có 6 chữ số");
      return;
    }

    try {
      setIsLoading(true);

      let res;
      if (mode === "forgot-password") {
        res = await authService.verifyOtpForgotPassword(email, otp);
      } else if (mode === "change-password") {
        res = await authService.verifyOtpChangePassword(email, otp);
      }

      setIsLoading(false);

      if (res.data.success) {
        toast.success("Xác thực OTP thành công!");
        
        // Navigate to reset password page
        if (mode === "forgot-password") {
          navigate("/reset-password", { state: { email, mode: "forgot-password" } });
        } else {
          navigate("/reset-password", { state: { email, mode: "change-password" } });
        }
      } else {
        toast.error(res.data.message || "Mã OTP không chính xác");
      }
    } catch (error) {
      setIsLoading(false);
      const message = error.response?.data?.message || "Mã OTP không chính xác";
      toast.error(message);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    try {
      setIsLoading(true);

      let res;
      if (mode === "forgot-password") {
        res = await authService.sendOtpForgotPassword(email);
      } else if (mode === "change-password") {
        res = await authService.sendOtpChangePassword(email);
      }

      setIsLoading(false);

      if (res.data.success) {
        toast.success("Mã OTP mới đã được gửi!");
        setOtp("");
        setCountdown(60);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Có lỗi xảy ra khi gửi lại OTP");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">
            Xác thực OTP
          </h1>
          <p className="text-gray-500 text-center mt-2">
            Mã OTP đã được gửi đến
          </p>
          <p className="font-semibold text-gray-800">{email}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mã OTP (6 chữ số)
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-center text-2xl tracking-widest font-semibold"
              placeholder="● ● ● ● ● ●"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-2 text-center">
              OTP có hiệu lực trong 5 phút
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className={`w-full text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "forgot-password" 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Đang xác thực..." : "Xác thực OTP"}
          </button>
        </form>

        {/* Resend */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Không nhận được mã?{" "}
            <button
              onClick={handleResendOtp}
              disabled={countdown > 0 || isLoading}
              className={`font-semibold disabled:text-gray-400 disabled:cursor-not-allowed ${
                mode === "forgot-password" ? "text-green-600 hover:underline" : "text-blue-600 hover:underline"
              }`}
            >
              {countdown > 0 ? `Gửi lại (${countdown}s)` : "Gửi lại"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;