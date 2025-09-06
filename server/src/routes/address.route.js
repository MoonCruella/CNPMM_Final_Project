import express from "express";
import {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Tất cả các route đều yêu cầu token
router.use(authenticateToken);

// CRUD địa chỉ (userId lấy từ token, không cần :userId trong URL)
router.post("/", addAddress); // Thêm địa chỉ
router.get("/", getAddresses); // Lấy danh sách địa chỉ
router.put("/:addressId", updateAddress); // Cập nhật địa chỉ
router.delete("/:addressId", deleteAddress); // Xóa địa chỉ
router.patch("/:addressId/default", setDefaultAddress); // Đặt mặc định

export default router;
