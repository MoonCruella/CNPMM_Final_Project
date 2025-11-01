import React, { useState, useRef, useEffect } from "react";
import authService from "../../services/authService";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

const VerifyOTPPage = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const location = useLocation();
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  // Get email and mode from state
  const { email, mode: stateMode } = location.state || {};
  
  //  Detect mode from URL pathname as fallback
  const mode = stateMode || (location.pathname.includes("change-password") 
    ? "change-password" 
    : location.pathname.includes("register")
    ? "register"
    : "forgot-password");

  // Check if email and mode exist
  useEffect(() => {
    if (!email) {
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
  }, [email, navigate]);

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
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    try {
      setLoading(true);
      let res;

      if (mode === "register") {
        res = await authService.verifyOtpRegister(email, otpCode);
      } else if (mode === "forgot-password") {
        res = await authService.verifyOtpForgotPassword(email, otpCode);
      } else if (mode === "change-password") {
        res = await authService.verifyOtpChangePassword(email, otpCode);
      }

      setLoading(false);

      if (res.data.success) {
        toast.success(res.data.message);
        
        // Navigate based on mode with correct URL
        if (mode === "register") {
          navigate("/login");
        } else if (mode === "forgot-password") {
          navigate("/forgot-password/reset", { state: { email, mode } });
        } else if (mode === "change-password") {
          navigate("/change-password/reset", { state: { email, mode } });
        }
      } else {
        toast.error(res.data.message || "Xác thực OTP thất bại");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(error.response?.data?.message || "Xảy ra lỗi, vui lòng thử lại!");
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    try {
      setLoading(true);
      let res;

      if (mode === "register") {
        res = await authService.resendOtpRegister(email);
      } else if (mode === "forgot-password") {
        res = await authService.sendOtpForgotPassword(email);
      } else if (mode === "change-password") {
        res = await authService.sendOtpChangePassword(email);
      }

      setLoading(false);

      if (res.data.success) {
        toast.success("Mã OTP mới đã được gửi!");
        setOtp(Array(6).fill("")); // Clear OTP
        setCountdown(60); // Reset countdown
      } else {
        toast.error(res.data.message || "Gửi lại OTP thất bại");
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(error.response?.data?.message || "Xảy ra lỗi, vui lòng thử lại!");
    }
  };

  const handleBackToEmail = () => {
    if (mode === "change-password") {
      navigate("/change-password", { state: { mode } });
    } else {
      navigate("/forgot-password");
    }
  };

  //  Get title and color based on mode
  const getTitle = () => {
    switch (mode) {
      case "register":
        return "Xác thực OTP để hoàn tất đăng ký";
      case "forgot-password":
        return "Xác thực OTP để đặt lại mật khẩu";
      case "change-password":
        return "Xác thực OTP để đổi mật khẩu";
      default:
        return "Xác thực OTP";
    }
  };

  const getColor = () => {
    return mode === "change-password" ? "blue" : "green";
  };

  const color = getColor();

  return (
    <div className={`flex min-h-screen items-center justify-center bg-gradient-to-br from-${color}-50 to-${color}-100`}>
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="mb-4 text-center text-2xl font-bold text-black">
          {getTitle()}
        </h2>
        <p className="mb-2 text-center text-gray-500">
          Nhập mã OTP đã được gửi tới email
        </p>
        <p className="mb-6 text-center font-semibold text-gray-700">{email}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputsRef.current[i] = el)}
                className={`h-12 w-12 rounded-lg border-2 text-center text-lg font-semibold focus:ring-2 focus:outline-none ${
                  color === "blue"
                    ? "border-green-400 bg-blue-50 text-green-700 focus:border-green-600 focus:ring-green-400"
                    : "border-green-400 bg-green-50 text-green-700 focus:border-green-600 focus:ring-green-400"
                }`}
                onChange={(e) => handleChange(e.target.value, i)}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className={`w-full rounded-xl py-3 text-white font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed ${
              color === "blue"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-500">
            Không nhận được mã?{" "}
            <button
              onClick={handleResend}
              disabled={countdown > 0 || loading}
              className={`font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed ${
                color === "blue" ? "text-green-600" : "text-green-600"
              }`}
            >
              {countdown > 0 ? `Gửi lại (${countdown}s)` : "Gửi lại OTP"}
            </button>
          </p>
          <button
            onClick={handleBackToEmail}
            className={`font-semibold hover:underline ${
              color === "blue" ? "text-green-600" : "text-green-600"
            }`}
          >
            ← Đổi email
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;