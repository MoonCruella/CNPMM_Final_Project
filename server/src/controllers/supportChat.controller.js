import supportChatService from '../services/supportChat.service.js';
import response from '../helpers/response.js';

export const startConversation = async (req, res) => {
  try {
    const customerId = req.user.userId;   
    const conversation = await supportChatService.getOrCreateConversation(customerId);   
    return response.sendSuccess(res, conversation, 'Conversation started', 200);
  } catch (error) {
    return response.sendError(res, 'Error starting conversation', 500, error);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const { conversationId, message, messageType, attachments, productRef } = req.body;
    if (!conversationId || !message) {
      return response.sendError(res, 'Conversation ID and message are required', 400);
    }
    const senderModel = userRole === 'seller' ? 'Seller' : 'User';   
    const newMessage = await supportChatService.sendMessage(
      conversationId,
      userId,
      senderModel,
      { message, messageType, attachments, productRef }
    );

    return response.sendSuccess(res, newMessage, 'Message sent', 201);
  } catch (error) {
    return response.sendError(res, 'Error sending message', 500, error);
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userRole = req.user.role;
    if (!conversationId) {
      return response.sendError(res, 'Conversation ID is required', 400);
    }
    const result = await supportChatService.getMessages(
      conversationId, 
      parseInt(page), 
      parseInt(limit)
    );
    
    // Mark as read
    const userType = userRole === 'seller' ? 'seller' : 'customer';
    await supportChatService.markAsRead(conversationId, userType);

    return response.sendSuccess(res, result, 'Messages retrieved', 200);
  } catch (error) {
    return response.sendError(res, 'Error getting messages', 500, error);
  }
};

export const getConversations = async (req, res) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = req.query;
    const userRole = req.user.role;

    // Chỉ seller mới có thể xem tất cả conversations
    if (userRole !== 'seller') {
      return response.sendError(res, 'Only sellers can view all conversations', 403);
    }

    const result = await supportChatService.getConversations(
      { status }, 
      parseInt(page), 
      parseInt(limit)
    );
    
    
    // Transform conversations để đảm bảo có customerName
    const transformedConversations = result.conversations.map(conv => {
      const transformed = {
        ...conv.toObject ? conv.toObject() : conv,
        customerName: conv.customerName || 
                      conv.customerId?.full_name || 
                      conv.customerId?.email || 
                      'Khách hàng',
        customerAvatar: conv.customerAvatar || 
                       conv.customerId?.avatar || 
                       null
      };
      
      
      return transformed;
    });
    
    const transformedResult = {
      conversations: transformedConversations,
      pagination: result.pagination
    };
    
    return response.sendSuccess(res, transformedResult, 'Conversations retrieved', 200);
  } catch (error) {
    return response.sendError(res, 'Error getting conversations', 500, error);
  }
};

export const closeConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userRole = req.user.role;

    if (!conversationId) {
      return response.sendError(res, 'Conversation ID is required', 400);
    }

    // Chỉ seller mới có thể đóng conversation
    if (userRole !== 'seller') {
      return response.sendError(res, 'Only sellers can close conversations', 403);
    }

    const conversation = await supportChatService.closeConversation(conversationId);
    
    return response.sendSuccess(res, conversation, 'Conversation closed', 200);
  } catch (error) {
    return response.sendError(res, 'Error closing conversation', 500, error);
  }
};

export const getStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    // Chỉ seller mới có thể xem stats
    if (userRole !== 'seller') {
      return response.sendError(res, 'Only sellers can view stats', 403);
    }
    const stats = await supportChatService.getStats(); 
    return response.sendSuccess(res, stats, 'Stats retrieved', 200);
  } catch (error) {
    return response.sendError(res, 'Error getting stats', 500, error);
  }
};