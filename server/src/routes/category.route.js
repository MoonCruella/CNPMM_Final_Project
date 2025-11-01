import express from "express";
import {
  getCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getAllCategoriesSimple,
} from "../controllers/category.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getCategories); // With pagination & search
router.get("/all", getAllCategoriesSimple); // Simple list for dropdown
router.get("/:id", getCategoryById);

// Protected routes (seller only)
router.post("/", authenticateToken, requireAdmin, createCategory);
router.put("/:id", authenticateToken, requireAdmin, updateCategory);
router.delete("/:id", authenticateToken, requireAdmin, deleteCategory);

export default router;