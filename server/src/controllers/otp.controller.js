import redisClient from "../utils/redisClient.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import User from "../models/user.model.js";
// Gửi OTP
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Tạo OTP 6 chữ số
    const otp = crypto.randomInt(100000, 999999).toString();

    // Lưu OTP vào Redis với TTL 120s
    await redisClient.setEx(`otp:register:${email}`, 120, otp);
    await redisClient.setEx(`otp:forgot:${email}`, 120, otp);

    // Gửi OTP qua email
    await sendMail(email, "Mã OTP của bạn", `Mã OTP: ${otp}`);

    res.status(200).json({ message: "OTP đã gửi về email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gửi OTP thất bại" });
  }
};

// Xác thực OTP
export const verifyOtpForgot = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const savedOtp = await redisClient.get(`otp:forgot:${email}`);
    if (!savedOtp) return res.status(400).json({ message: "OTP hết hạn hoặc không tồn tại" });

    if (savedOtp !== otp) return res.status(400).json({ message: "OTP không đúng" });

    // Xóa OTP sau khi verify
    await redisClient.del(`otp:${email}`);

    res.status(200).json({ message: "Xác thực OTP thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xác thực OTP thất bại" });
  }
};

export const verifyOtpRegister = async(req, res) =>{
  try {
    const { email, otp } = req.body;

    const savedOtp = await redisClient.get(`otp:register:${email}`);
    if (!savedOtp) return res.status(400).json({ message: "OTP hết hạn hoặc không tồn tại" });

    if (savedOtp !== otp) return res.status(400).json({ message: "OTP không đúng" });

    // Cập nhật user thành active
    await User.findOneAndUpdate({ email }, { active: true });

    // Xóa OTP
    await redisClient.del(`otp:${email}`);

    res.status(200).json({ message: "Xác thực OTP thành công, tài khoản đã kích hoạt" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xác thực OTP thất bại" });
  }
}
