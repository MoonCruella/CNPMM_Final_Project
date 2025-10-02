import api from './api';

class SupportChatService {
  // Start a new conversation
  async startConversation() {
    try {
      const response = await api.post('/api/support/conversation/start'); 
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Send a message
  async sendMessage(conversationId, messageData) {
    try {
      const response = await api.post('/api/support/message/send', { 
        conversationId,
        ...messageData
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await api.get(`/api/support/conversation/${conversationId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get all conversations (seller only)
  async getConversations(filters = {}) {
    try {
      const response = await api.get('/api/support/conversations', { 
        params: filters
      });

      
      // Kiểm tra cấu trúc response
      if (response.data && response.data.success) {
        
        // Map customerName từ customerId.full_name nếu không có
        const conversations = response.data.data.conversations.map(conv => ({
          ...conv,
          customerName: conv.customerName || conv.customerId?.full_name || conv.customerId?.email || 'Khách hàng',
          customerAvatar: conv.customerAvatar || conv.customerId?.avatar || null
        }));
        
        return {
          ...response.data,
          data: {
            ...response.data.data,
            conversations
          }
        };
      }
      
    
      return {
        success: false,
        data: { conversations: [], pagination: {} },
        message: 'Invalid response format'
      };
    } catch (error) {
      throw error;
    }
  }

  // Close a conversation
  async closeConversation(conversationId) {
    try {
      const response = await api.put(`/api/support/conversation/${conversationId}/close`); // PUT, conversation/:id/close
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get stats (seller only)
  async getStats() {
    try {
      const response = await api.get('/api/support/stats'); 
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new SupportChatService();