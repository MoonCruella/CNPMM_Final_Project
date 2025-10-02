import { useState, useRef, useEffect } from 'react';
import { useSupportChat } from '../../context/SupportChatContext';
import { useUserContext } from '../../context/UserContext';
import { Button } from '../ui/button';
import { X, Send, MessageCircle, Wifi, WifiOff } from 'lucide-react';

const SupportChat = () => {
  const { user } = useUserContext();
  const { 
    isOpen, 
    conversation, 
    messages, 
    isLoading, 
    unreadCount,
    isConnected,
    toggleChat, 
    sendMessage 
  } = useSupportChat();
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const success = await sendMessage(input);
    if (success) {
      setInput('');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Không hiển thị nếu user chưa đăng nhập
  if (!user) return null;

  // Nút floating khi đóng
  if (!isOpen) {
    return (
      <Button
        onClick={toggleChat}
        className="fixed bottom-24 right-6 rounded-full h-14 w-14 bg-green-600 hover:bg-green-700 p-0 shadow-lg z-50"
        aria-label="Open support chat"
      >
        <MessageCircle size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -left-1 bg-red-500 rounded-full p-1">
            <WifiOff size={12} className="text-white" />
          </span>
        )}
      </Button>
    );
  }

  // Cửa sổ chat
  return (
    <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col border overflow-hidden z-50 animate-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="p-4 bg-green-600 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center relative">
            <MessageCircle size={20} />
            {isConnected ? (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
            ) : (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-red-400 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div>
            <h3 className="font-medium">Hỗ trợ khách hàng</h3>
            <p className="text-xs opacity-90 flex items-center gap-1">
              {isConnected ? (
                <>
                  <Wifi size={12} />
                  {conversation?.sellerId ? 'Đang trả lời...' : 'Sẵn sàng'}
                </>
              ) : (
                <>
                  <WifiOff size={12} />
                  Đang kết nối...
                </>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleChat}
          className="h-8 w-8 text-white hover:bg-white/20"
        >
          <X size={18} />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chào bạn! 👋</p>
            <p className="text-xs mt-1">Hãy gửi tin nhắn để chúng tôi hỗ trợ bạn</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.senderModel === 'User';
            return (
              <div
                key={msg._id || index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
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
                          {msg.senderName?.charAt(0) || 'S'}
                        </div>
                      )}
                      <span className="text-xs text-gray-600">{msg.senderName || 'Shop'}</span>
                    </div>
                  )}

                  <div
                    className={`p-3 rounded-lg ${
                      isOwn
                        ? 'bg-green-600 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    
                    {msg.productRef && (
                      <div className="mt-2 p-2 bg-white/10 rounded border border-white/20">
                        <div className="flex gap-2">
                          <img
                            src={msg.productRef.images?.[0]?.image_url}
                            alt={msg.productRef.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {msg.productRef.name}
                            </p>
                            <p className="text-xs">
                              {new Intl.NumberFormat('vi-VN').format(msg.productRef.price)}₫
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isConnected ? "Nhập tin nhắn..." : "Đang kết nối..."}
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
            disabled={isLoading || !isConnected}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim() || !isConnected}
            size="icon"
            className="h-10 w-10 bg-green-600 hover:bg-green-700"
          >
            <Send size={18} />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {isConnected ? 'Thời gian phản hồi: 5-10 phút' : 'Đang kết nối lại...'}
        </p>
      </form>
    </div>
  );
};

export default SupportChat;