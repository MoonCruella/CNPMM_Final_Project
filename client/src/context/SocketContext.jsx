import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAppContext } from './AppContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated, tokenRefreshed } = useAppContext();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectAttemptsRef = useRef(0); // Thay thế state bằng useRef
  const MAX_RECONNECT_ATTEMPTS = 5;
  const socketRef = useRef(null); // Thêm ref để theo dõi socket hiện tại

  // Hàm helper để lấy token từ localStorage
  const getAccessTokenFromStorage = () => {
    return localStorage.getItem('accessToken');
  };

  // Tạo hoặc cập nhật kết nối socket
  const createSocketConnection = useCallback(() => {
    // Đóng kết nối cũ nếu có
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Lấy token trực tiếp từ localStorage
    const token = getAccessTokenFromStorage();
    if (!token) {
      console.error("No access token available for socket connection");
      return null;
    }

    // Tạo kết nối socket mới
    const socketInstance = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000', {
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // Xử lý các sự kiện
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      connectAttemptsRef.current = 0; // Sử dụng ref
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
      
      // Nếu lỗi liên quan đến authentication, có thể token đã hết hạn
      if (err.message.includes('auth') || err.message.includes('unauthorized')) {
        // Thử lại sau 2 giây với token mới nhất
        connectAttemptsRef.current += 1;
        
        if (connectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => {
            reconnectWithNewToken();
          }, 2000);
        } else {
          console.error('Max socket reconnect attempts reached');
        }
      }
    });

    socketRef.current = socketInstance; // Lưu socket hiện tại vào ref
    setSocket(socketInstance);
    return socketInstance;
  }, []);  // Loại bỏ dependencies không cần thiết

  // Initial connection when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = createSocketConnection();
      
      // Cleanup on component unmount
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }
  }, [isAuthenticated, user, createSocketConnection]);

  // Reconnect when token is refreshed
  useEffect(() => {
    if (tokenRefreshed && isAuthenticated && user) {
      console.log('Token was refreshed, reconnecting socket');
      createSocketConnection();
    }
  }, [tokenRefreshed, isAuthenticated, user, createSocketConnection]);

  // Handle reconnection with new token
  const reconnectWithNewToken = useCallback(() => {
    try {
      // Lấy token trực tiếp từ localStorage
      const token = getAccessTokenFromStorage();
      
      if (!token) {
        console.error('No access token available for socket reconnection');
        return;
      }
      
      if (socketRef.current) {
        socketRef.current.auth = { token };
        socketRef.current.connect();
        console.log('Attempting socket reconnection with new token');
      } else {
        createSocketConnection();
      }
    } catch (error) {
      console.error('Socket reconnect error:', error);
    }
  }, [createSocketConnection]);

  // Manual reconnect function exposed to components
  const reconnect = useCallback(() => {
    connectAttemptsRef.current = 0; // Reset attempts counter
    reconnectWithNewToken();
  }, [reconnectWithNewToken]);

  // Socket service object - implements common socket operations
  const socketService = {
    emit: (event, data, callback) => {
      if (!socket || !isConnected) {
        console.warn('Socket not connected, cannot emit:', event);
        return false;
      }
      socket.emit(event, data, callback);
      return true;
    },
    
    on: (event, handler) => {
      if (!socket) return () => {};
      socket.on(event, handler);
      return () => socket.off(event, handler);
    },
    
    off: (event, handler) => {
      if (!socket) return;
      socket.off(event, handler);
    },
    
    // Emit with promise-based response handling
    emitAsync: (event, data, timeout = 5000) => {
      return new Promise((resolve, reject) => {
        if (!socket || !isConnected) {
          reject(new Error('Socket not connected'));
          return;
        }
        
        const timer = setTimeout(() => {
          reject(new Error('Socket response timeout'));
        }, timeout);
        
        socket.emit(event, data, (response) => {
          clearTimeout(timer);
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      });
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected, 
      reconnect,
      socketService
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Hook để sử dụng socket service trực tiếp
export const useSocketService = () => {
  const { socketService } = useSocket();
  return socketService;
};