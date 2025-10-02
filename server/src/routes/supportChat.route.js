import express from 'express';
import {
  startConversation,
  sendMessage,
  getMessages,
  getConversations,
  closeConversation,
  getStats
} from '../controllers/supportChat.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/conversation/start', authenticateToken, startConversation);
router.post('/message/send', authenticateToken, sendMessage);
router.get('/conversation/:conversationId/messages', authenticateToken, getMessages);
router.get('/conversations', authenticateToken, getConversations);
router.put('/conversation/:conversationId/close', authenticateToken, closeConversation);
router.get('/stats', authenticateToken, getStats);

export default router;