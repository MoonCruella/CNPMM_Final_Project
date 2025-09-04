import express from "express";
import {
  Register,
  Login,
  resetPassword,
  refreshToken,
  logout,
  logoutAll
} from "../controllers/auth.controller.js";
import { authenticateToken, requireAdmin, requireOwnerOrAdmin } from "../middleware/auth.middleware.js";
import {
  resendOtpRegister,
  sendOtpForgotPass,
  verifyOtpForgot,
  verifyOtpRegister,
} from "../controllers/otp.controller.js";

const router = express.Router();

router.post("/login", Login);
router.post('/refresh-token', refreshToken);
// Protected routes
router.post('/logout', authenticateToken, logout);
router.post('/logout-all', authenticateToken, logoutAll);

router.get("/get-user", authenticateToken, (req, res) => {
  res.status(200).json({ status: true, user: req.user });
});

//Register
router.post("/register", Register);
router.post("/register/resend-otp", resendOtpRegister);
router.post("/register/verify-otp", verifyOtpRegister);

//Forgot Password
router.post("/forgot-password/send-otp", sendOtpForgotPass);
router.post("/forgot-password/verify-otp", verifyOtpForgot);
router.post("/forgot-password/reset", resetPassword);

export default router;
