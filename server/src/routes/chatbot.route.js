import express from 'express';
import * as chatbotController from '../controllers/chatbot.controller.js';
import { authenticateToken, checkAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Route cho người dùng chưa đăng nhập và đã đăng nhập
router.post('/message', checkAuth, chatbotController.getChatbotResponse);

// Route chỉ cho người dùng đã đăng nhập
router.get('/history/:sessionId', authenticateToken, chatbotController.getChatHistory);

export default router;