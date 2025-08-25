import userModel from "../models/user.model.js";
import { verifyOtpRegister } from "./otp.controller.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendMail from "../utils/sendMail.js";      
import redisClient from "../utils/redisClient.js";
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

export const Register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const emailCheck = await userModel.findOne({ email });
    if (emailCheck) {
      return res.status(400).json({ message: "Email is already existed" });
    } else {
      const hashPassword = bcrypt.hashSync(req.body.password, SALT_ROUNDS);
      let newUser = req.body;
      newUser.password = hashPassword;
      newUser.active = false;

      const createdUser = await userModel.create(newUser);
      if (!createdUser) {
        return res.sendError(res, "User is existed");
      }

      const otpResult = await sendOtpToEmail(createdUser.email);
      if (otpResult.success) {
        return res.status(201).json({
          message:
            "User created successfully. Please check your email for OTP verification.",
          user: { _id: createdUser._id, email: createdUser.email },
        });
      } else {
        return res.status(201).json({
          message:
            "User created successfully but OTP sending failed. Please try to resend OTP.",
          user: { _id: createdUser._id, email: createdUser.email },
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    //check if user not registered
    const user = await User.findOne({ email }).lean().exec();
    if (!user) {
      return res.status(403).json({
        status: false,
        message: "Invalid login credentials.",
      });
    }

    // check password
    const isVerifyPassword = await bcryptjs.compare(password, user.password);
    if (!isVerifyPassword) {
      return res.status(403).json({
        status: false,
        message: "Invalid login credentials.",
      });
    }

    delete user.password;

    const token = jwt.sign(user, process.env.JWT_SECRET);
    res.cookie("access_token", token, {
      httpOnly: true,
    });
    res.status(200).json({
      status: true,
      message: "Login success.",
    });
  } catch (error) {
    res.status(500),
      json({
        status: false,
        error,
      });
  }
};
