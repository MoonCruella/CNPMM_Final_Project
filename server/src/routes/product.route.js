// routes/productRoutes.js
import express from "express";
import {
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
  
} from "../controllers/product.controller.js";
import { authenticateToken, checkAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Favorite routes
router.post("/:productId/favorite", authenticateToken, toggleFavorite);
router.get("/favorites", authenticateToken, getFavoriteProducts);


router.get("/viewed", authenticateToken, getViewedProducts);

// Similar products & stats
router.get("/:productId/similar", getSimilarProducts);
router.get("/:productId/stats", getProductStats);

// Public routes
router.get("/", getAllProducts);
router.get("/best-sellers", getBestSellers);
router.get("/discounts", getBiggestDiscounts);
router.get("/newest", getNewestProducts);


// Product detail route
router.get("/:id", checkAuth ,getProductById);

export default router;
