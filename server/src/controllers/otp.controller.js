import redisClient from "../utils/redisClient.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import User from "../models/user.model.js";
export const resendOtpRegister = async (req, res) => {
  try {
    const { email, userName } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!userName) return res.status(400).json({ message: "Username is required" });

    // Kiểm tra user tồn tại với cả email và username
    const user = await User.findOne({ email, userName });
    if (!user) {
      return res.status(404).json({ 
        message: "Email hoặc username không đúng. Vui lòng kiểm tra lại thông tin." 
      });
    }

    // Kiểm tra user đã active chưa
    if (user.active) {
      return res.status(400).json({ 
        message: "Tài khoản đã được kích hoạt rồi" 
      });
    }

    // Tạo OTP 6 chữ số mới
    const otp = crypto.randomInt(100000, 999999).toString();

    // Xóa OTP cũ nếu có và lưu OTP mới vào Redis với TTL 120s
    await redisClient.del(`otp:register:${email}`);
    await redisClient.setEx(`otp:register:${email}`, 120, otp);

    // Gửi OTP qua email
    await sendMail(email, "Mã OTP tái kích hoạt", `Mã OTP tái kích hoạt của bạn: ${otp}`);

    res.status(200).json({ message: "OTP đã gửi lại về email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gửi OTP thất bại" });
  }
};

// Xác thực OTP cho Register
export const verifyOtpRegister = async(req, res) =>{
  try {
    const { email, otp } = req.body;
    const savedOtp = await redisClient.get(`otp:register:${email}`);
    if (!savedOtp) return res.status(400).json({ message: "OTP hết hạn hoặc không tồn tại" });
    if (savedOtp !== otp) return res.status(400).json({ message: "OTP không đúng" });
    
    // Cập nhật user thành active
    await User.findOneAndUpdate({ email }, { active: true });
    
    // Xóa OTP
    await redisClient.del(`otp:register:${email}`);
    
    res.status(200).json({ message: "Xác thực OTP thành công, tài khoản đã kích hoạt" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xác thực OTP thất bại" });
  }
}

// Gửi OTP cho Forgot Password
export const sendOtpForgotPass = async (req, res) => {
  try {
    const { email, userName } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    //if (!userName) return res.status(400).json({ message: "Username is required" });

    // Kiểm tra user tồn tại với cả email và username
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        message: "Email hoặc username không đúng. Vui lòng kiểm tra lại thông tin." 
      });
    }

    // Tạo OTP 6 chữ số
    const otp = crypto.randomInt(100000, 999999).toString();

    // Lưu OTP vào Redis với TTL 120s (chỉ cho forgot password)
    await redisClient.setEx(`otp:forgot:${email}`, 120, otp);

    // Gửi OTP qua email
    await sendMail(email, "Mã OTP quên mật khẩu", `Mã OTP quên mật khẩu của bạn: ${otp}`);

    res.status(200).json({ message: "OTP đã gửi về email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Gửi OTP thất bại" });
  }
};

// Xác thực OTP cho Forgot Password
export const verifyOtpForgot = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const savedOtp = await redisClient.get(`otp:forgot:${email}`);
    if (!savedOtp) return res.status(400).json({ message: "OTP hết hạn hoặc không tồn tại" });

    if (savedOtp !== otp) return res.status(400).json({ message: "OTP không đúng" });

    // Xóa OTP sau khi verify
    await redisClient.del(`otp:forgot:${email}`);
    
    // Lưu trạng thái đã verify (có thời hạn 10 phút)
    await redisClient.setEx(`verified:forgot:${email}`, 600, "true");

    res.status(200).json({ message: "Xác thực OTP thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Xác thực OTP thất bại" });
  }
};

