import express from "express";
import { createPayment, callback, queryStatus } from "../controllers/zalopay.controller.js";

const router = express.Router();

router.post("/payment", createPayment);
router.post("/callback", callback);
router.get("/query", queryStatus);

export default router;
