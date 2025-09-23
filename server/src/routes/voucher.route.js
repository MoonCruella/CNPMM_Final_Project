import express from "express";
import {
  createVoucher,
  getAllVouchers,
  updateVoucher,
  deleteVoucher,
  applyVoucher,
  applyAutoFreeship,
} from "../controllers/voucher.controller.js";

import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// 📌 Admin
router.post("/", authenticateToken, createVoucher); // Tạo voucher
router.get("/", authenticateToken, getAllVouchers); // Lấy danh sách voucher (có filter + phân trang)
router.put("/:id", authenticateToken, updateVoucher); // Cập nhật voucher
router.delete("/:id", authenticateToken, deleteVoucher); // Xóa voucher

// 📌 User
router.post("/apply", authenticateToken, applyVoucher); // Nhập tay mã
router.post("/apply/freeship", authenticateToken, applyAutoFreeship); // Freeship tự động

export default router;
