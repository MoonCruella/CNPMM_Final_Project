import privateApi  from "./privateApi";
import api from "./api";

class ChatbotService {
  async sendMessage(message, sessionId = null) {
    try {
      const payload = { message };
      if (sessionId) {
        payload.sessionId = sessionId;
      }
      // Sử dụng privateApi nếu user đã đăng nhập, api nếu chưa
      const apiClient = localStorage.getItem('accessToken') ? privateApi : api;
      
      const response = await apiClient.post('/api/chatbot/message', payload);
      return response.data;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  }

  async getChatHistory(sessionId) {
    try {
      const response = await api.get(`/api/chatbot/history/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }
}

export default new ChatbotService();