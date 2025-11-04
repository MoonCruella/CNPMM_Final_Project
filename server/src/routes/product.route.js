// routes/productRoutes.js
import express from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getBestSellers,
  getBiggestDiscounts,
  getNewestProducts,
  getProductById,
  toggleFavorite,
  getFavoriteProducts,
  getViewedProducts,
  getSimilarProducts,
  getProductStats,
  getByCategory,
} from "../controllers/product.controller.js";
import {
  authenticateToken,
  checkAuth,
  checkAuthOptional,
} from "../middleware/auth.middleware.js";

const router = express.Router();

// Favorite routes
router.post("/:productId/favorite", authenticateToken, toggleFavorite);
router.get("/favorites", authenticateToken, getFavoriteProducts);

router.get("/viewed", authenticateToken, getViewedProducts);

// Similar products & stats
router.get("/:productId/similar", getSimilarProducts);
router.get("/:productId/stats", getProductStats);

// Public routes
router.get("/", checkAuthOptional, getAllProducts);
router.post("/", authenticateToken, createProduct);
router.put("/:id", authenticateToken, updateProduct);
router.delete("/:id", authenticateToken, deleteProduct);

// Special product lists
router.get("/best-sellers", getBestSellers);
router.get("/discounts", getBiggestDiscounts);
router.get("/newest", getNewestProducts);
router.get("/byCategory/:categoryId", getByCategory);

// Product detail route
router.get("/:id", checkAuth, getProductById);

export default router;
