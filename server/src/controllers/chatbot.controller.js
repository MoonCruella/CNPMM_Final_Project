import { v4 as uuidv4 } from 'uuid';
import ChatMessage from '../models/chat.model.js';
import chatbotService from '../services/chatbot.service.js';
import response from '../helpers/response.js';

export const getChatbotResponse = async (req, res) => {
  try {
    const { message, sessionId = uuidv4() } = req.body || {};
    const userId = req.user?.userId; // Có thể null nếu chưa đăng nhập
    
    if (!message || typeof message !== "string") {
      return response.sendError(res, "Message is required", 400);
    }

    // Gọi AI service
    const ai = await chatbotService.getChatbotResponse(message);

    // Lưu lịch sử chat nếu user đã đăng nhập
    if (userId) {
      try {
        await ChatMessage.create({
          userId,
          sessionId,
          message,
          response: ai.response,
          metadata: {
            relevantProducts: ai.products.map(p => p._id),
            searchQuery: message,
            resolved: false,
            ...ai.metadata
          }
        });
      } catch (dbError) {
        console.error("Error saving chat history:", dbError);
        // Không làm gián đoạn response nếu lưu DB lỗi
      }
    }

    return response.sendSuccess(
      res,
      {
        response: ai.response,
        products: ai.products,
        sessionId,
        metadata: ai.metadata
      },
      "Chatbot response generated successfully",
      200
    );
  } catch (err) {
    console.error("Chatbot controller error:", err);
    return response.sendError(res, "Error processing chatbot request", 500);
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionId } = req.params;

    const history = await ChatMessage.find({ userId, sessionId })
      .populate('metadata.relevantProducts', 'name price images')
      .sort({ createdAt: 1 })
      .limit(50);

    return response.sendSuccess(
      res, 
      history, 
      'Chat history retrieved successfully', 
      200
    );
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return response.sendError(res, 'Error fetching chat history', 500, error);
  }
};