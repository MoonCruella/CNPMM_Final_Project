import redisClient from "../utils/redisClient.js";
import sendMail from "../utils/sendMail.js";
import crypto from "crypto";
import User from "../models/user.model.js";
import response from "../helpers/response.js";

export const resendOtpRegister = async (req, res) => {
  try {
    //const { email, userName } = req.body;
    const { email } = req.body;
    if (!email) return response.sendError(res, "Email is required", 400);
    //if (!userName) return response.sendError(res, "Username is required", 400);

    // Kiểm tra user tồn tại
    //const user = await User.findOne({ email, userName });
    const user = await User.findOne({ email });
    if (!user) {
      return response.sendError(
        res,
        "Email hoặc username không đúng. Vui lòng kiểm tra lại thông tin.!",
        404
      );
    }

    // Kiểm tra user đã active chưa
    if (user.active) {
      return response.sendError(res, "Tài khoản đã được kích hoạt rồi!", 400);
    }

    // Check giới hạn resend OTP
    const limitKey = `otp:limit:${email}`;
    if (await redisClient.get(limitKey)) {
      return response.sendError(
        res,
        "Vui lòng chờ 1 phút trước khi gửi lại OTP",
        429
      );
    }
    await redisClient.setEx(limitKey, 60, "true"); // lock resend 60s

    // Tạo OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Xóa OTP cũ và lưu OTP mới
    await redisClient.del(`otp:register:${email}`);
    await redisClient.setEx(`otp:register:${email}`, 120, otp);

    // Gửi OTP qua email
    await sendMail(
      email,
      "Mã OTP tái kích hoạt",
      `Mã OTP tái kích hoạt của bạn: ${otp}`
    );

    return response.sendSuccess(
      res,
      null,
      "OTP đã gửi lại về email của bạn!",
      200
    );
  } catch (err) {
    console.error(err);
    return response.sendError(res, "Gửi OTP thất bại!", 500, err.message);
  }
};

// Xác thực OTP cho Register
export const verifyOtpRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const savedOtp = await redisClient.get(`otp:register:${email}`);
    if (!savedOtp) {
      return response.sendError(res, "OTP hết hạn hoặc không tồn tại!", 400);
    }

    if (savedOtp !== otp) {
      return response.sendError(res, "OTP không hợp lệ!", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      return response.sendError(res, "Không tìm thấy user!", 404);
    }

    // Cập nhật user thành active
    await User.findOneAndUpdate({ email }, { active: true });

    // Xóa OTP
    await redisClient.del(`otp:register:${email}`);

    return response.sendSuccess(
      res,
      null,
      "Xác thực OTP thành công, tài khoản đã kích hoạt!"
    );
  } catch (err) {
    console.error(err);
    return response.sendError(res, "Xác thực OTP thất bại!", 500, err.message);
  }
};

// Gửi OTP cho ForgotPassword
export const sendOtpForgotPass = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return response.sendError(res, "Email is required!", 400);

    const user = await User.findOne({ email });
    if (!user) return response.sendError(res, "Email không tồn tại!", 404);

    const limitKey = `otp:limit:${email}`;
    if (await redisClient.get(limitKey))
      return response.sendError(
        res,
        "Vui lòng chờ 1 phút trước khi gửi lại OTP!",
        429
      );
    await redisClient.setEx(limitKey, 60, "true");

    const otp = crypto.randomInt(100000, 999999).toString();
    // Xóa OTP cũ và lưu OTP mới
    await redisClient.del(`otp:forgot:${email}`);
    await redisClient.setEx(`otp:forgot:${email}`, 120, otp);
    await redisClient.setEx(limitKey, 60, "true"); // lock resend 60s

    // Gửi OTP qua email
    await sendMail(
      email,
      "Mã OTP tái kích hoạt",
      `Mã OTP tái kích hoạt của bạn: ${otp}`
    );

    return response.sendSuccess(res, null, "OTP đã gửi về email của bạn!");
  } catch (err) {
    console.error(err);
    return response.sendError(res, "Gửi OTP thất bại. Vui lòng thử lại!");
  }
};

// Xác thực OTP cho Forgot Password
export const verifyOtpForgot = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return response.sendError(res, "Email và OTP là bắt buộc!", 400);
    }

    const savedOtp = await redisClient.get(`otp:forgot:${email}`);
    if (!savedOtp) {
      return response.sendError(res, "OTP hết hạn hoặc không tồn tại!", 400);
    }

    if (savedOtp !== otp) {
      return response.sendError(res, "OTP không hợp lệ!", 400);
    }

    // Xóa OTP sau khi verify
    await redisClient.del(`otp:forgot:${email}`);

    // Lưu trạng thái đã verify (TTL 10 phút)
    await redisClient.setEx(`verified:forgot:${email}`, 600, "true");

    return response.sendSuccess(res, null, "Xác thực OTP thành công!");
  } catch (err) {
    console.error(err);
    return response.sendError(res, "Xác thực OTP thất bại!");
  }
};
