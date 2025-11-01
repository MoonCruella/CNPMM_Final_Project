import express from "express";
import {
  getUserOrders,
  getOrderById,
  cancelOrder,
  reorder,
  createOrder,
  getOrderStats,
  updateShippingInfo,
  getAllOrders,
  searchOrders,
  getUserOrdersByAdmin,
} from "../controllers/order.controller.js";
import {
  authenticateToken,
  requireAdmin,
  
} from "../middleware/auth.middleware.js";
const router = express.Router();
router.use(authenticateToken);

// Get user orders with filter and pagination
// GET /api/orders/user?status=pending&page=1&limit=10&sort=created_at&order=desc
router.get("/user", getUserOrders);

// Get order statistics
// GET /api/orders/stats
router.get("/stats", getOrderStats);

// Admin lấy tất cả đơn hàng với filter & pagination
// GET /api/orders/all?status=pending&page=1&limit=10&sort=created_at&order=desc
router.get("/all", requireAdmin, getAllOrders);
router.get("/my-orders/search", authenticateToken, searchOrders);
router.get("/search", authenticateToken, requireAdmin, searchOrders);
// ✅ Get specific order by ID
// GET /api/orders/:orderId
router.get("/:orderId",authenticateToken, getOrderById);

// Create new order
// POST /api/orders
router.post("/", createOrder);

// Cancel order
// PUT /api/orders/:orderId/cancel
router.put("/:orderId/cancel", cancelOrder);

// Reorder (add items to cart again)
// POST /api/orders/:orderId/reorder
router.post("/:orderId/reorder", reorder);

// Admin cập nhật thông tin vận chuyển đơn hàng
// PUT /api/orders/:orderId/shipping
router.put("/:orderId/shipping", requireAdmin, updateShippingInfo);
router.get("/user/:userId", getUserOrdersByAdmin);

export default router;
