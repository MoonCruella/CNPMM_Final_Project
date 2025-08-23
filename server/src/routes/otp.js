import express from "express";
import { sendOtp, verifyOtpRegister } from "../controllers/otp.controller.js";

const router = express.Router();

// Gửi OTP đến email
router.post("/send", sendOtp);

// Xác thực OTP
router.post("/verify", verifyOtpRegister);

export default router;