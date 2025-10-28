import express from "express";
const router = express.Router();
import {
  getRevenue,
  getNewOrdersCount,
  getDashboardSummary,
  getTopProducts,
} from "../controllers/revenue.controller.js";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

// GET /api/revenue?period=day|week|month&start=ISO&end=ISO&status=...
router.get("/", authenticateToken, requireAdmin, getRevenue);

// GET /api/revenue/new-orders?since=ISO
router.get("/new-orders", authenticateToken, requireAdmin, getNewOrdersCount);

// GET /api/revenue/summary
router.get("/summary", authenticateToken, requireAdmin, getDashboardSummary);

// GET /api/revenue/top-products?period=week|month&limit=10
router.get("/top-products", authenticateToken, requireAdmin, getTopProducts);

export default router;
