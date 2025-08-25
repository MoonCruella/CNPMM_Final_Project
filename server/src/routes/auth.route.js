import express from "express";
import { Register, Login, registerVerifyOtp } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { forgotPasswordSendOtp, forgotPasswordVerifyOtp, resetPassword } from "../controllers/forgotPassword.controller.js";

const router = express.Router();


router.post("/login", Login);
router.get("/get-user", authenticate, (req, res) => {
  res.status(200).json({ status: true, user: req.user });
});

//Register
router.post("/register", Register);
//router.post("/register/send-otp", registerSendOtp);
router.post("/register/verify-otp", registerVerifyOtp);

//Forgot Password
router.post("/forgot-password/send-otp", forgotPasswordSendOtp);
router.post("/forgot-password/verify-otp", forgotPasswordVerifyOtp);
router.post("/forgot-password/reset", resetPassword);

export default router;
