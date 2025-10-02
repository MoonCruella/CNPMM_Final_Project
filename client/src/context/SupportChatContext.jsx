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
      console.log('⚠️ Not ready to join room:', {
        hasSocket: !!socket,
        isConnected,
        hasConversation: !!conversation
      });
      return;
    }

    const roomName = `support:${conversation.conversationId}`;
    console.log('🔌 Joining room:', roomName);
    
    socket.emit('join_support_room', conversation.conversationId);

    // Verify after a short delay
    setTimeout(() => {
      console.log('📍 Verifying room join...');
      // Socket.io client doesn't expose rooms, but server will log it
    }, 500);

    return () => {
      console.log('👋 Leaving room:', roomName);
      socket.emit('leave_support_room', conversation.conversationId);
    };
  }, [socket, isConnected, conversation]);

  // Khởi tạo conversation
  const startConversation = async () => {
    if (!user) {
      console.log('⚠️ No user found');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('🚀 Starting conversation...');
      const response = await supportChatService.startConversation();
      
      if (response.success) {
        console.log('✅ Conversation created:', response.data);
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
      console.log('📥 Loading messages for:', conversationId);
      const response = await supportChatService.getMessages(conversationId);
      if (response.success) {
        console.log('✅ Loaded messages:', response.data.messages.length);
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
      console.log('⚠️ Cannot send: no conversation or empty message');
      return false;
    }

    try {
      const messageData = {
        message,
        messageType,
        ...(productRef && { productRef })
      };

      console.log('📤 Sending message:', messageData);
      const response = await supportChatService.sendMessage(
        conversation.conversationId,
        messageData
      );

      if (response.success) {
        console.log('✅ Message sent successfully:', response.data);
        
        // Thêm message ngay lập tức vào UI
        const newMessage = response.data;
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === newMessage._id);
          if (exists) {
            console.log('⚠️ Message already exists in state');
            return prev;
          }
          console.log('➕ Adding message to state immediately');
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
      console.log('⚠️ Socket listener not ready:', {
        hasSocket: !!socket,
        isConnected,
        hasConversation: !!conversation
      });
      return;
    }

    console.log('👂 Setting up socket listener for conversation:', conversation.conversationId);

    const handleNewMessage = (newMessage) => {
      console.log('📨 Received socket message:', newMessage);
      
      // Kiểm tra conversation ID
      if (newMessage.conversationId !== conversation.conversationId) {
        console.log('⚠️ Message for different conversation');
        return;
      }
      
      setMessages(prev => {
        // Kiểm tra duplicate bằng _id hoặc createdAt + message
        const exists = prev.some(msg => 
          msg._id === newMessage._id ||
          (msg.createdAt === newMessage.createdAt && msg.message === newMessage.message)
        );
        
        if (exists) {
          console.log('⚠️ Message already in state, skipping');
          return prev;
        }
        
        console.log('✅ Adding new message from socket to state');
        return [...prev, newMessage];
      });
      
      // Tăng unread nếu chat đóng và message từ seller
      if (!isOpen && newMessage.senderModel === 'Seller') {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('support_new_message', handleNewMessage);

    return () => {
      console.log('🧹 Cleaning up socket listener');
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