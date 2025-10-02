import { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../context/ChatBoxContext.jsx';
import { Button } from '../ui/button';
import { X, Send, MessageSquare, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCardChatBot from './item/ProductCardChatBot.jsx'; 

const Chatbot = () => {
  const { isOpen, messages, isLoading, toggleChatbot, sendMessage, resetChat } = useChatbot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  // Xử lý hiệu ứng ẩn hiện khi cuộn
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY + 50) {
        if (!isOpen) setIsVisible(false);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isOpen]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    sendMessage(input);
    setInput('');
  };

  // Component ProductCards Container cho chatbot
  const ChatbotProductCards = ({ products }) => {
    if (!products || products.length === 0) return null;

    return (
      <div className="mt-3">
        <div className="text-xs text-gray-500 mb-2 font-medium">
          💡 Gợi ý sản phẩm ({products.length}):
        </div>
        
        {/* Hiển thị tối đa 3 sản phẩm trong chatbot */}
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {products.slice(0, 3).map((product) => (
            <ProductCardChatBot 
              key={product._id}
              product={product}
              onClose={toggleChatbot}
            />
          ))}
        </div>

        {/* Hiển thị thông báo nếu có nhiều hơn 3 sản phẩm */}
        {products.length > 3 && (
          <div className="text-xs text-gray-500 text-center py-3 border-t mt-3 bg-gray-50 rounded">
            <div className="mb-1">
              <span>Và {products.length - 3} sản phẩm khác phù hợp</span>
            </div>
            <button 
              onClick={() => {
                navigate('/products');
                toggleChatbot();
              }}
              className="text-primary hover:underline font-medium"
            >
              👀 Xem tất cả sản phẩm
            </button>
          </div>
        )}
      </div>
    );
  };

  // Component hiển thị tin nhắn
  const MessageBubble = ({ msg, index }) => {
    return (
      <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[90%] ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
          {/* Text response */}
          <div
            className={`p-3 rounded-lg ${
              msg.type === 'user'
                ? 'bg-primary text-white rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }`}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
          </div>

          {/* Products (chỉ hiển thị với tin nhắn bot có sản phẩm) */}
          {msg.type === 'bot' && msg.products && msg.products.length > 0 && (
            <ChatbotProductCards products={msg.products} />
          )}
        </div>
      </div>
    );
  };

  // Nút chatbot thu nhỏ (khi chưa mở)
  if (!isOpen) {
    return (
      <Button
        onClick={toggleChatbot}
        className={`fixed bottom-6 right-6 rounded-full h-14 w-14 bg-primary hover:bg-primary/90 p-0 shadow-lg z-50 transition-all duration-300 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
        aria-label="Open chat"
      >
        <MessageSquare size={24} className="animate-pulse" />
      </Button>
    );
  }

  // Cửa sổ chatbot (khi đã mở)
  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col border overflow-hidden z-50 animate-in slide-in-from-bottom-10 duration-300">
      {/* Header */}
      <div className="p-4 bg-primary text-white flex justify-between items-center">
        <div>
          <h3 className="font-medium">🤖 Trợ lý ảo</h3>
          <p className="text-xs opacity-90">Hỏi tôi về sản phẩm!</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={resetChat}
            className="h-8 w-8 text-white hover:bg-primary/80"
            title="Đặt lại cuộc trò chuyện"
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleChatbot}
            className="h-8 w-8 text-white hover:bg-primary/80"
          >
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chào bạn! 👋</p>
            <p className="text-xs mt-1">Hãy hỏi tôi về sản phẩm bạn quan tâm!</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <MessageBubble key={index} msg={msg} index={index} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800 rounded-bl-none">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">Đang tìm kiếm...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về sản phẩm, giá cả, khuyến mãi..."
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-10 w-10"
          >
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;