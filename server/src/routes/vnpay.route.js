import express from "express";
import { createPaymentUrl, vnpayReturn } from "../controllers/vnpay.controller.js";

const router = express.Router();

router.post("/payment", createPaymentUrl);
router.get("/return", vnpayReturn);

export default router;