import express from "express";
import { Register, Login } from "../controllers/Authcontroller.js";
import { authenticate } from "../middleware/authenticate.js";
import { forgotPasswordSendOtp, forgotPasswordVerifyOtp, resetPassword } from "../controllers/forgotPassword.controller.js";

const router = express.Router();

router.post("/register", Register);
router.post("/login", Login);
router.get("/get-user", authenticate, (req, res) => {
  res.status(200).json({ status: true, user: req.user });
});

//Forgot Password
router.post("/forgot-password/send-otp", forgotPasswordSendOtp);
router.post("/forgot-password/verify-otp", forgotPasswordVerifyOtp);
router.post("/forgot-password/reset", resetPassword);

export default router;
