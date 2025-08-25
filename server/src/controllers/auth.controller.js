import userModel from "../models/user.model.js";
import { verifyOtpRegister } from "./otp.controller.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "../utils/sendMail.js";
import redisClient from "../utils/redisClient.js";
import response from "../helpers/response.js";
import { config } from "../config/env.js";

import * as authMethod from "../method/auth.method.js";

export const registerVerifyOtp = verifyOtpRegister;
const SALT_ROUNDS = 10;
const sendOtpToEmail = async (email) => {
  try {
    // Tạo OTP 6 chữ số
    const otp = crypto.randomInt(100000, 999999).toString();

    // Lưu OTP vào Redis với TTL 120s
    await redisClient.setEx(`otp:register:${email}`, 120, otp);

    // Gửi OTP qua email
    await sendMail(email, "Mã OTP đăng ký", `Mã OTP đăng ký của bạn: ${otp}`);

    return { success: true };
  } catch (error) {
    console.error("Send OTP error:", error);
    return { success: false, error };
  }
};
export const Register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return response.sendError(
        res,
        "Name, Email và Password là bắt buộc",
        400
      );
    }

    // Check email tồn tại
    const emailCheck = await userModel.findOne({ email });
    if (emailCheck) {
      return response.sendError(res, "Email is already existed", 400);
    }

    // Hash password
    const hashPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const newUser = {
      ...req.body,
      password: hashPassword,
      active: false,
    };

    const createdUser = await userModel.create(newUser);
    if (!createdUser) {
      return response.sendError(res, "Tạo user thất bại", 500);
    }

    // Gửi OTP
    const otpResult = await sendOtpToEmail(createdUser.email);

    if (otpResult.success) {
      return response.sendSuccess(res, {
        message:
          "User created successfully. Please check your email for OTP verification.",
        user: createdUser,
      });
    } else {
      return response.sendSuccess(res, {
        message:
          "User created successfully but OTP sending failed. Please try to resend OTP.",
        user: createdUser,
      });
    }
  } catch (error) {
    console.error(error);
    return response.sendError(res, "Đăng ký thất bại", 500, error.message);
  }
};

export const Login = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const user = await userModel.findOne({ email }).lean().exec();
    if (!user) {
      return response.sendError(res, "User not found", 404);
    } else {
      console.log(bcrypt.compareSync(password, user.password));
      if (!bcrypt.compareSync(password, user.password)) {
        return response.sendError(
          res,
          "Password or username is incorrect",
          401
        );
      }
      // Thêm kiểm tra active
      if (!user.active) {
        return response.sendError(
          res,
          "Tài khoản chưa được kích hoạt. Hãy xác nhận mã OTP cho tài khoản mình",
          401
        );
      }

      const dataForAccessToken = {
        email: email,
      };
      const accessToken = authMethod.generateJwt(dataForAccessToken);
      // let refreshToken = randToken.generate()
      return response.sendSuccess(res, {
        accessToken,
        user,
      });
    }
  } catch (error) {
    console.log("Error", error);
    next(error);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email) return response.sendError(res, "Email is required", 400);
    if (!newPassword)
      return response.sendError(res, "New password is required", 400);

    // Sửa ở đây: dùng userModel thay vì User
    const user = await userModel.findOne({ email });
    if (!user) return response.sendError(res, "Người dùng không tồn tại", 404);

    const isVerified = await redisClient.get(`verified:forgot:${email}`);
    if (!isVerified)
      return response.sendError(
        res,
        "Vui lòng verify OTP trước khi reset password",
        400
      );

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await redisClient.del(`verified:forgot:${email}`);

    return response.sendSuccess(res, null, "Đặt lại mật khẩu thành công");
  } catch (err) {
    console.error(err);
    return response.sendError(res, "Reset mật khẩu thất bại", 500, err.message);
  }
};
