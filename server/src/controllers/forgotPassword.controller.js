import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import { sendOtpForgotPass, verifyOtpForgot } from "./otp.controller.js"; 
import redisClient from "../utils/redisClient.js";

export const forgotPasswordSendOtp = sendOtpForgotPass;


export const forgotPasswordVerifyOtp = verifyOtpForgot;


export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!newPassword) return res.status(400).json({ message: "New password is required" });


    // Kiểm tra user tồn tại
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

    // Kiểm tra OTP đã được verify chưa
    const isVerified = await redisClient.get(`verified:forgot:${email}`);
    if (!isVerified) {
      return res.status(400).json({ 
        message: "Vui lòng verify OTP trước khi reset password" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Xóa trạng thái verified sau khi reset password thành công
    await redisClient.del(`verified:forgot:${email}`);
   
    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reset mật khẩu thất bại" });
  }
};
