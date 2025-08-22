import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { sendOtp, verifyOtp } from "./otp.controller.js"; // tái sử dụng

// Bước 1: Gửi OTP
export const forgotPasswordSendOtp = sendOtp;

// Bước 2: Xác thực OTP
export const forgotPasswordVerifyOtp = verifyOtp;

// Bước 3: Reset mật khẩu
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Kiểm tra user tồn tại
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update vào DB
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reset mật khẩu thất bại" });
  }
};
