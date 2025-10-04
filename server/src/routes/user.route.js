import express from "express";
import * as userController from "../controllers/user.controller.js";
import {
  authenticateToken,
  requireAdmin,
  requireOwnerOrAdmin,
} from "../middleware/auth.middleware.js";
import {
  getUsers,
  getUserByEmail,
  getUserList,
  toggleUserStatus,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";
const router = express.Router();
router.get("/profile/me", authenticateToken, async (req, res) => {
  req.params.userId = req.user.userId;
  return getUserProfile(req, res);
});
router.get("/", authenticateToken, userController.getUsers);
//router.get('/profile/:email', authenticateToken ,userController.getUserByEmail)
router.put("/profile/update", authenticateToken, userController.updateUser);
// Admin routes
router.get("/admin/list", authenticateToken, requireAdmin, getUserList);
router.get("/admin/all", authenticateToken, requireAdmin, getUsers);
router.put(
  "/admin/toggle-status/:userId",
  authenticateToken,
  requireAdmin,
  toggleUserStatus
);

// Protected routes
router.get(
  "/profile/:userId",
  authenticateToken,
  requireOwnerOrAdmin,
  getUserProfile
);
router.put(
  "/profile/:userId",
  authenticateToken,
  requireOwnerOrAdmin,
  updateUserProfile
);

export default router;
