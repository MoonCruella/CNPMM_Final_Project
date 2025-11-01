import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  removeMultipleItems,
} from "../controllers/cart.controller.js";

import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, getCart);
router.post("/", authenticateToken, addToCart);
router.put("/:id", authenticateToken, updateCartItem);
router.delete("/:id", authenticateToken, removeFromCart);
router.delete("/", authenticateToken, clearCart);
router.delete("/items/batch", authenticateToken, removeMultipleItems);

export default router;
