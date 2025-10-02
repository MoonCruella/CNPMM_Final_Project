import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import supportChatService from '../../services/supportChat.service';
import { Button } from '../ui/button';
import { MessageCircle, Send, Clock, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const SupportChatSeller = () => {
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [stats, setStats] = useState({ activeConversations: 0, totalUnread: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations
  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      setError(null);
      
      const response = await supportChatService.getConversations({ status: 'active' });
      
      if (response.success) {
        setConversations(response.data.conversations || []);
      } else {
        setError('Không thể tải danh sách hội thoại');
        toast.error('Không thể tải danh sách hội thoại');
      }
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra');
      toast.error('Có lỗi khi tải danh sách hội thoại');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load messages
  const loadMessages = async (conversationId) => {
    try {
      setIsLoading(true);
      const response = await supportChatService.getMessages(conversationId);
      
      if (response.success) {
        setMessages(response.data.messages || []);
      } else {
        toast.error('Không thể tải tin nhắn');
      }
    } catch (error) {
      toast.error('Có lỗi khi tải tin nhắn');
    } finally {
      setIsLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await supportChatService.getStats();
      if (response.success) {
        setStats(response.data || { activeConversations: 0, totalUnread: 0 });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedConversation) return;

    try {
      setIsLoading(true);
      const response = await supportChatService.sendMessage(selectedConversation.conversationId, {
        message: input
      });
      
      if (response.success) {
        setInput('');
      } else {
        toast.error('Không thể gửi tin nhắn');
      }
    } catch (error) {
      toast.error('Có lỗi khi gửi tin nhắn');
    } finally {
      setIsLoading(false);
    }
  };

  // Close conversation
  const handleCloseConversation = async () => {
    try {
      await supportChatService.closeConversation(selectedConversation.conversationId);
      setSelectedConversation(null);
      loadConversations();
      toast.success('Đã đóng hội thoại');
    } catch (error) {
      toast.error('Không thể đóng hội thoại');
    }
  };

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (selectedConversation?.conversationId === newMessage.conversationId) {
        setMessages(prev => {
          const exists = prev.some(msg => msg._id === newMessage._id);
          return exists ? prev : [...prev, newMessage];
        });
      }
      loadConversations();
      loadStats();
    };

    const handleConversationUpdate = () => {
      loadConversations();
      loadStats();
    };

    socket.on('support_new_message', handleNewMessage);
    socket.on('support_conversation_update', handleConversationUpdate);

    return () => {
      socket.off('support_new_message', handleNewMessage);
      socket.off('support_conversation_update', handleConversationUpdate);
    };
  }, [socket, selectedConversation]);

  // Initial load
  useEffect(() => {
    loadConversations();
    loadStats();
  }, []);

  // Join room when select conversation
  useEffect(() => {
    if (selectedConversation && socket) {
      socket.emit('join_support_room', selectedConversation.conversationId);
      loadMessages(selectedConversation.conversationId);
    }
  }, [selectedConversation, socket]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    conv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render conversation item
  const ConversationItem = ({ conv }) => (
    <div
      onClick={() => setSelectedConversation(conv)}
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
        selectedConversation?.conversationId === conv.conversationId
          ? 'bg-green-50 border-l-4 border-l-green-600'
          : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {conv.customerAvatar ? (
          <img
            src={conv.customerAvatar}
            alt={conv.customerName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
            {conv.customerName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-medium text-sm truncate">
              {conv.customerName || 'Khách hàng'}
            </h3>
            {conv.unreadCountSeller > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 ml-2">
                {conv.unreadCountSeller}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 truncate mb-1">
            {conv.lastMessage || 'Chưa có tin nhắn'}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={12} />
            <span>{formatTime(conv.lastMessageAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render message item
  const MessageItem = ({ msg }) => {
    const isOwn = msg.senderModel === 'Seller';
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <div className="max-w-[70%]">
          {!isOwn && (
            <div className="flex items-center gap-2 mb-1">
              {msg.senderAvatar ? (
                <img
                  src={msg.senderAvatar}
                  alt={msg.senderName}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                  {msg.senderName?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs text-gray-600">{msg.senderName || 'Khách hàng'}</span>
            </div>
          )}
          <div
            className={`p-3 rounded-lg ${
              isOwn
                ? 'bg-green-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 shadow-sm rounded-bl-none'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
            <p className="text-xs opacity-70 mt-1">{formatTime(msg.createdAt)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r flex flex-col bg-white">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-3">Hỗ trợ khách hàng</h2>
          
          {/* Stats */}
          <div className="flex gap-4 mb-3 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600">
                Đang hoạt động: <strong>{stats.activeConversations}</strong>
              </span>
            </div>
            {stats.totalUnread > 0 && (
              <span className="text-red-600">
                Chưa đọc: <strong>{stats.totalUnread}</strong>
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-3"></div>
              <p className="text-sm">Đang tải...</p>
            </div>
          )}

          {error && !isLoadingConversations && (
            <div className="flex flex-col items-center justify-center h-full text-red-500 p-4">
              <AlertCircle size={48} className="mb-3" />
              <p className="text-sm text-center mb-3">{error}</p>
              <Button onClick={loadConversations} size="sm" variant="outline">
                Thử lại
              </Button>
            </div>
          )}

          {!isLoadingConversations && !error && filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <MessageCircle size={48} className="mb-2 opacity-30" />
              <p className="text-sm text-center">
                {searchTerm ? 'Không tìm thấy hội thoại nào' : 'Chưa có hội thoại nào'}
              </p>
              {!searchTerm && (
                <p className="text-xs text-center mt-2 text-gray-400">
                  Khi khách hàng nhắn tin, hội thoại sẽ xuất hiện ở đây
                </p>
              )}
            </div>
          )}

          {!isLoadingConversations && !error && filteredConversations.length > 0 && (
            filteredConversations.map((conv) => (
              <ConversationItem key={conv.conversationId} conv={conv} />
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b flex justify-between items-center">
              <div className="flex items-center gap-3">
                {selectedConversation.customerAvatar ? (
                  <img
                    src={selectedConversation.customerAvatar}
                    alt={selectedConversation.customerName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-medium">
                    {selectedConversation.customerName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-medium">{selectedConversation.customerName || 'Khách hàng'}</h3>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Đang hoạt động
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleCloseConversation}>
                Đóng hội thoại
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {isLoading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <MessageCircle size={48} className="mb-2 opacity-30" />
                  <p className="text-sm">Chưa có tin nhắn nào</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <MessageItem key={msg._id || index} msg={msg} />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  disabled={isLoading || !input.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Send size={18} />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Chọn một hội thoại để bắt đầu</p>
              <p className="text-sm">Khách hàng của bạn đang chờ bạn trả lời</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportChatSeller;