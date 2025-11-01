import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useUserContext } from './UserContext';
import supportChatService from '../services/supportChat.service';

const SupportChatContext = createContext();

export const useSupportChat = () => {
  const context = useContext(SupportChatContext);
  if (!context) {
    throw new Error('useSupportChat must be used within SupportChatProvider');
  }
  return context;
};

export const SupportChatProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useUserContext();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Join socket room khi có conversation và socket connected
  useEffect(() => {
    if (!socket || !isConnected || !conversation) {
      
      return;
    }

    const roomName = `support:${conversation.conversationId}`;
    
    socket.emit('join_support_room', conversation.conversationId);

    // Verify after a short delay
    setTimeout(() => {
      // Socket.io client doesn't expose rooms, but server will log it
    }, 500);

    return () => {
      socket.emit('leave_support_room', conversation.conversationId);
    };
  }, [socket, isConnected, conversation]);

  // Khởi tạo conversation
  const startConversation = async () => {
    if (!user) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await supportChatService.startConversation();
      
      if (response.success) {
        setConversation(response.data);
        await loadMessages(response.data.conversationId);
      }
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages
  const loadMessages = async (conversationId) => {
    try {
      const response = await supportChatService.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data.messages);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    }
  };

  // Gửi tin nhắn
  const sendMessage = useCallback(async (message, messageType = 'text', productRef = null) => {
    if (!conversation || !message.trim()) {
      return false;
    }

    try {
      const messageData = {
        message,
        messageType,
        ...(productRef && { productRef })
      };

      const response = await supportChatService.sendMessage(
        conversation.conversationId,
        messageData
      );

      if (response.success) {
        
        // Thêm message ngay lập tức vào UI
        const newMessage = response.data;
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === newMessage._id);
          if (exists) {
            return prev;
          }
          return [...prev, newMessage];
        });
        
        return true;
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }, [conversation]);

  // Toggle chat window
  const toggleChat = async () => {
    if (!isOpen && !conversation) {
      await startConversation();
    }
    setIsOpen(!isOpen);
  };

  // Socket listener cho tin nhắn mới
  useEffect(() => {
    if (!socket || !isConnected || !conversation) {
    
      return;
    }


    const handleNewMessage = (newMessage) => {
      
      // Kiểm tra conversation ID
      if (newMessage.conversationId !== conversation.conversationId) {
        return;
      }
      
      setMessages(prev => {
        // Kiểm tra duplicate bằng _id hoặc createdAt + message
        const exists = prev.some(msg => 
          msg._id === newMessage._id ||
          (msg.createdAt === newMessage.createdAt && msg.message === newMessage.message)
        );
        
        if (exists) {
          return prev;
        }
        
        return [...prev, newMessage];
      });
      
      // Tăng unread nếu chat đóng và message từ seller
      if (!isOpen && newMessage.senderModel === 'Seller') {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('support_new_message', handleNewMessage);

    return () => {
      socket.off('support_new_message', handleNewMessage);
    };
  }, [socket, isConnected, conversation, isOpen]);

  const value = {
    isOpen,
    conversation,
    messages,
    isLoading,
    unreadCount,
    isConnected,
    toggleChat,
    sendMessage,
    startConversation
  };

  return (
    <SupportChatContext.Provider value={value}>
      {children}
    </SupportChatContext.Provider>
  );
};