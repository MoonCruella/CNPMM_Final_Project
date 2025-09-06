// routes/productRoutes.js
import express from "express";
import {
  getAllProducts,
  getBestSellers,
  getBiggestDiscounts,
  getNewestProducts,
  getProductById
} from "../controllers/product.controller.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/best-sellers", getBestSellers);
router.get("/discounts", getBiggestDiscounts);
router.get("/newest", getNewestProducts);
router.get("/:id", getProductById); 

export default router;
