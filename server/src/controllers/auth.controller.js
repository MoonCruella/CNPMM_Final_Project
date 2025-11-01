import userModel from "../models/user.model.js";
import { verifyOtpRegister } from "./otp.controller.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import sendMail from "../utils/sendMail.js";
import redisClient from "../utils/redisClient.js";
import response from "../helpers/response.js";
import { config } from "../config/env.js";
import { generateTokenPair, verifyRefreshToken } from "../utils/jwt.js";
import AuthGoogleController from "./google.controller.js";
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
      return response.sendError(res, "Email không tồn tại!", 404);
    } else {
      console.log(bcrypt.compareSync(password, user.password));
      if (!bcrypt.compareSync(password, user.password)) {
        return response.sendError(res, "Email hoặc mật khẩu không đúng!", 401);
      }
      // Thêm kiểm tra active
      if (!user.active) {
        return response.sendError(
          res,
          "Tài khoản chưa được kích hoạt. Hãy xác nhận mã OTP cho tài khoản mình",
          401
        );
      }

      const payload = {
        userId: user._id,
        email: user.email,
        role: user.role,
        coin: user.coin,
        active: user.active,
        name: user.name,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        date_of_birth: user.date_of_birth,
        avatar: user.avatar,
      };

      const { accessToken, refreshToken } = generateTokenPair(payload);

      // Lưu refresh token vào database
      const userDoc = await userModel.findById(user._id);
      const deviceInfo = req.get("User-Agent") || "Unknown Device";
      await userDoc.addRefreshToken(refreshToken, deviceInfo);

      // Cập nhật last login
      await userDoc.updateLastLogin();

      return response.sendSuccess(
        res,
        {
          user: {
            userId: user._id,
            email: user.email,
            role: user.role,
            coin: user.coin,
            name: user.name,
            active: user.active,
            address: user.address,
            phone: user.phone,
            gender: user.gender,
            date_of_birth: user.date_of_birth,
            avatar: user.avatar,
          },
          accessToken,
          refreshToken,
        },
        "Đăng nhập thành công",
        200
      );
    }
  } catch (error) {
    console.log("Error", error);
    next(error);
  }
};

// Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return response.sendError(res, "Refresh token không được cung cấp", 400);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Tìm user và select tất cả fields cần thiết
    const user = await userModel
      .findById(decoded.userId)
      .select('-password') // Loại trừ password
      .lean(); // Chuyển về plain object để dễ xử lý

    if (!user) {
      return response.sendError(res, "User không tồn tại", 401);
    }

    // Lấy user document để kiểm tra token
    const userDoc = await userModel.findById(decoded.userId);

    // Kiểm tra refresh token có trong database không
    const tokenExists = userDoc.refresh_tokens.find(
      (item) => item.token === refreshToken
    );
    if (!tokenExists) {
      return response.sendError(res, "Refresh token không hợp lệ", 401);
    }

    // Kiểm tra token hết hạn
    if (new Date() > tokenExists.expires_at) {
      await userDoc.removeRefreshToken(refreshToken);
      return response.sendError(res, "Refresh token đã hết hạn", 401);
    }

    // Generate new tokens với DATA MỚI NHẤT từ database
    const payload = {
      userId: userDoc._id,
      email: userDoc.email,
      role: userDoc.role,
      coin: userDoc.coin,
      name: userDoc.name,
      active: userDoc.active,
      address: userDoc.address,
      phone: userDoc.phone,
      gender: userDoc.gender,
      date_of_birth: userDoc.date_of_birth,
      avatar: userDoc.avatar,
    };

    console.log('🔄 Refresh token - New payload:', payload);

    const { accessToken, refreshToken: newRefreshToken } =
      generateTokenPair(payload);

    // Remove old refresh token và add new
    await userDoc.removeRefreshToken(refreshToken);
    const deviceInfo = req.get("User-Agent") || "Unknown Device";
    await userDoc.addRefreshToken(newRefreshToken, deviceInfo);

    return response.sendSuccess(
      res,
      {
        user: payload, // ✅ Trả về user data mới nhất
        accessToken,
        refreshToken: newRefreshToken,
      },
      "Token đã được làm mới",
      200
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return response.sendError(
      res,
      "Refresh token không hợp lệ",
      401,
      error.message
    );
  }
};
// Logout
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return response.sendError(res, "Refresh token không được cung cấp", 400);
    }

    const user = await userModel.findById(req.user.userId);
    if (user) {
      await user.removeRefreshToken(refreshToken);
    }

    return response.sendSuccess(res, null, "Đăng xuất thành công", 200);
  } catch (error) {
    console.error("Logout error:", error);
    return response.sendError(res, "Đăng xuất thất bại", 500, error.message);
  }
};
// Logout All Devices
export const logoutAll = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.userId);

    if (user) {
      await user.removeAllRefreshTokens();
    }

    return response.sendSuccess(
      res,
      null,
      "Đăng xuất khỏi tất cả thiết bị thành công",
      200
    );
  } catch (error) {
    console.error("Logout all error:", error);
    return response.sendError(res, "Đăng xuất thất bại", 500, error.message);
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

const googleAuthController = new AuthGoogleController();

export const googleLogin = async (req, res) => {
  try {
    const url = googleAuthController.generateUrl();
    return response.sendSuccess(
      res,
      { url },
      "Google OAuth URL generated successfully",
      200
    );
  } catch (error) {
    console.error("Google login error:", error);
    return response.sendError(
      res,
      "Failed to generate Google OAuth URL",
      500,
      error.message
    );
  }
};

export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${config.client_url || 'http://localhost:5173'}/login?error=no_code`);
    }

    // Get user data from Google
    const googleData = await googleAuthController.callBack(code);

    if (!googleData || !googleData.email) {
      return res.redirect(`${config.client_url || 'http://localhost:5173'}/login?error=invalid_data`);
    }

    const { email, name, picture, sub: googleId, email_verified } = googleData;

    // Find or create user
    let user = await userModel.findOne({ email });

    if (user) {
      // ✅ Check if existing user is a seller
      if (user.role === 'seller') {
        return res.redirect(
          `${config.client_url || 'http://localhost:5173'}/login?error=seller_account`
        );
      }

      // Update existing user with Google info
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
      }
      // If account is not active, activate it (Google verified)
      if (!user.active && email_verified) {
        user.active = true;
      }
      await user.save();
    } else {
      // ✅ Create new user - ALWAYS role = 'user'
      user = await userModel.create({
        email,
        name: name || email.split('@')[0],
        googleId,
        avatar: picture,
        role: 'user', // ✅ Force role = user
        active: email_verified || true,
        password: crypto.randomBytes(32).toString('hex'),
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.redirect(`${config.client_url || 'http://localhost:5173'}/login?error=account_inactive`);
    }

    // Generate tokens
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role, // Will always be 'user'
      coin: user.coin,
      active: user.active,
      name: user.name,
      phone: user.phone,
      address: user.address,
      gender: user.gender,
      date_of_birth: user.date_of_birth,
      avatar: user.avatar,
    };

    const { accessToken, refreshToken } = generateTokenPair(payload);

    // Save refresh token
    const deviceInfo = req.get("User-Agent") || "Google OAuth Login";
    await user.addRefreshToken(refreshToken, deviceInfo);

    // Update last login
    await user.updateLastLogin();

    // Redirect to frontend with tokens
    const redirectUrl = `${config.client_url || 'http://localhost:5173'}/auth/google/success?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error("Google callback error:", error);
    return res.redirect(`${config.client_url || 'http://localhost:5173'}/login?error=server_error`);
  }
};

