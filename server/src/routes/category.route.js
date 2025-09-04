import express from "express";
import {
  getCategories,
  createCategory,
  getCategoryById
} from "../controllers/category.controller.js";

const router = express.Router();

// Lấy danh sách categories
router.get("/", getCategories);

// (Tùy chọn) Thêm category mới
router.post("/", createCategory);

router.get("/:id", getCategoryById);

export default router;
