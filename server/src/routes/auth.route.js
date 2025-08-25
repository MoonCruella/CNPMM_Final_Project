import express from "express";
import {
  Register,
  Login,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import {
  resendOtpRegister,
  sendOtpForgotPass,
  verifyOtpForgot,
  verifyOtpRegister,
} from "../controllers/otp.controller.js";

const router = express.Router();

router.post("/login", Login);
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
