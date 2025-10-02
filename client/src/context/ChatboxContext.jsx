import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import chatbotService from '../services/chatbotService';
import { useAppContext } from './AppContext';

const ChatbotContext = createContext();

export const ChatbotProvider = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', content: 'Xin chào! Tôi là trợ lý ảo, tôi có thể giúp gì cho bạn?' }
  ]);
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Khởi tạo sessionId
  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatSessionId');
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      localStorage.setItem('chatSessionId', newSessionId);
    }
  }, []);

  // Tải lịch sử chat khi đăng nhập và có sessionId
  useEffect(() => {
    const loadChatHistory = async () => {
      if (isAuthenticated && sessionId) {
        try {
          setIsLoading(true);
          const { data } = await chatbotService.getChatHistory(sessionId);

          if (data && data.length > 0) {
            const formattedMessages = [];

            // Thêm tin nhắn chào mừng
            formattedMessages.push({
              type: 'bot',
              content: 'Xin chào! Tôi là trợ lý ảo, tôi có thể giúp gì cho bạn?'
            });

            // Thêm các tin nhắn từ lịch sử
            data.forEach(item => {
              formattedMessages.push({ type: 'user', content: item.message });
              formattedMessages.push({ type: 'bot', content: item.response });
            });

            setMessages(formattedMessages);
          }
        } catch (error) {
          console.error('Error loading chat history:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadChatHistory();
  }, [isAuthenticated, sessionId]);

  const toggleChatbot = () => setIsOpen(prevState => !prevState);

  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Thêm tin nhắn user
    const userMessage = { type: 'user', content: message };
    const tempMessages = [...messages, userMessage];
    setMessages(tempMessages);
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage(message, sessionId);

      if (response.success) {
        const botMessage = {
          type: 'bot',
          content: response.data.response,
          products: response.data.products || [], // Lưu danh sách sản phẩm
          metadata: response.data.metadata
        };

        setMessages([...tempMessages, botMessage]);
        setSessionId(response.data.sessionId);
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'bot',
        content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
        products: []
      };
      setMessages([...tempMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
    localStorage.setItem('chatSessionId', newSessionId);

    setMessages([
      { type: 'bot', content: 'Xin chào! Tôi là trợ lý ảo, tôi có thể giúp gì cho bạn?' }
    ]);
  };

  const value = {
    isOpen,
    messages,
    isLoading,
    toggleChatbot,
    sendMessage,
    resetChat
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => useContext(ChatbotContext);