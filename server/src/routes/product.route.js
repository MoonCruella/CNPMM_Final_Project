// routes/productRoutes.js
import express from "express";
import { getBestSellers } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/best-sellers", getBestSellers);

export default router;
