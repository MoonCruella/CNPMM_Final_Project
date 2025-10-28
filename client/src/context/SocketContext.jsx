import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  // Chỉ sử dụng Redux để lấy thông tin user và authentication
  const { user, isAuthenticated, accessToken } = useSelector(state => state.auth);
  
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const socketRef = useRef(null);
  const prevAuthRef = useRef({ userId: null, token: null });
  
  // THÊM: Biến để ngăn chặn kết nối liên tục
  const preventReconnectRef = useRef(false);
  const initializedRef = useRef(false);
  const connectTimeoutRef = useRef(null);

  // Hàm helper để lấy token từ Redux hoặc localStorage
  const getAccessToken = useCallback(() => {
    // Ưu tiên token từ Redux state
    if (accessToken) {
      return accessToken;
    }
    // Fallback về localStorage nếu cần
    return localStorage.getItem('accessToken');
  }, [accessToken]);

  // Tạo hoặc cập nhật kết nối socket
  const createSocketConnection = useCallback(() => {
    // Ngăn chặn kết nối liên tục
    if (preventReconnectRef.current) {
      return null;
    }

    // Đóng kết nối cũ nếu có
    if (socketRef.current) {
      socketRef.current.removeAllListeners(); // Quan trọng: xóa tất cả listeners
      socketRef.current.disconnect();
    }

    // Lấy token 
    const token = getAccessToken();
    if (!token) {
      console.error("No access token available for socket connection");
      return null;
    }

    // Kiểm tra nếu user hoặc token đã thay đổi
    const currentUserId = user?._id;
    
    // Nếu không có thay đổi về user/token và đã kết nối, không cần kết nối lại
    if (
      isConnected && 
      socketRef.current && 
      socketRef.current.connected &&
      prevAuthRef.current.userId === currentUserId && 
      prevAuthRef.current.token === token
    ) {
      console.log('Socket already connected with same user/token');
      return socketRef.current;
    }

    // Lưu trạng thái hiện tại
    prevAuthRef.current = { userId: currentUserId, token };

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
      setIsConnected(true);
      connectAttemptsRef.current = 0;
      initializedRef.current = true; // Đánh dấu đã kết nối thành công
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected, reason:', reason);
      setIsConnected(false);
      
      // THÊM: Ngăn kết nối lại tự động nếu ngắt kết nối do client
      if (reason === 'io client disconnect' || reason === 'io server disconnect') {
        console.log('⚠️ Manual disconnect detected, preventing auto-reconnect');
        preventReconnectRef.current = true;
        
        // Cho phép kết nối lại sau một khoảng thời gian
        setTimeout(() => {
          preventReconnectRef.current = false;
        }, 5000);
      }
    });

    socketInstance.on('connect_error', (err) => {
      console.error('🔴 Socket connection error:', err.message);
      setIsConnected(false);
      
      // Nếu lỗi liên quan đến authentication, có thể token đã hết hạn
      if (err.message.includes('auth') || err.message.includes('unauthorized')) {
        connectAttemptsRef.current += 1;
        
        if (connectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          // Sử dụng timeout để tránh kết nối liên tục
          if (connectTimeoutRef.current) {
            clearTimeout(connectTimeoutRef.current);
          }
          
          connectTimeoutRef.current = setTimeout(() => {
            if (!preventReconnectRef.current) {
              reconnectWithNewToken();
            }
          }, 2000 * (connectAttemptsRef.current + 1)); // Tăng dần thời gian đợi
        } else {
          console.error('Max socket reconnect attempts reached');
          // Đánh dấu để ngăn kết nối liên tục
          preventReconnectRef.current = true;
          
          // Reset sau 30 giây
          setTimeout(() => {
            preventReconnectRef.current = false;
            connectAttemptsRef.current = 0;
          }, 30000);
        }
      }
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);
    return socketInstance;
  }, [getAccessToken, isConnected, user]);

  // Phản ứng với thay đổi trạng thái xác thực từ Redux - QUAN TRỌNG NHẤT
  useEffect(() => {
    // Dùng timeout để tránh nhiều lần kết nối liên tiếp
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
    }
    
    // Chỉ kết nối khi đã xác thực và có user
    if (isAuthenticated && user && user._id) {
      // Chỉ kết nối nếu chưa được kết nối hoặc user ID thay đổi
      const currentUserId = user._id;
      const prevUserId = prevAuthRef.current.userId;
      
      if (!isConnected || currentUserId !== prevUserId) {
        
        // Đặt timeout ngắn để tránh gọi nhiều lần
        connectTimeoutRef.current = setTimeout(() => {
          // Kiểm tra lại điều kiện trước khi kết nối
          if (!isConnected && !preventReconnectRef.current) {
            const newSocket = createSocketConnection();
            
            // Cleanup khi component unmount
            // Cẩn thận: đừng gây ra vòng lặp cleanup -> connect -> cleanup
            preventReconnectRef.current = true;
            setTimeout(() => {
              preventReconnectRef.current = false;
            }, 1000);
          }
        }, 500);
      }
    }
    
    return () => {
      // Cleanup timeout nếu component unmount
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user?._id, createSocketConnection, isConnected]);

  // Handle reconnection with new token
  const reconnectWithNewToken = useCallback(() => {
    try {
      if (preventReconnectRef.current) {
        console.log('Reconnect prevented to avoid loop');
        return;
      }
      
      const token = getAccessToken();
      
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
  }, [getAccessToken, createSocketConnection]);

  // Manual reconnect function exposed to components
  const reconnect = useCallback(() => {
    console.log('🔄 Manual reconnect requested');
    
    // Reset các biến phòng vệ
    connectAttemptsRef.current = 0;
    preventReconnectRef.current = false;
    
    // Đảm bảo socket hiện tại đã được dọn dẹp
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Kết nối lại sau một khoảng thời gian ngắn
    setTimeout(() => {
      reconnectWithNewToken();
    }, 300);
  }, [reconnectWithNewToken]);

  // THÊM: Manual connect with explicit token
  const connect = useCallback((token) => {
    if (!token) {
      console.error('⚠️ Cannot connect: no token provided');
      return null;
    }
    
    console.log('🔌 Manual connect with explicit token');
    
    // Reset biến phòng vệ
    preventReconnectRef.current = false;
    connectAttemptsRef.current = 0;
    
    // Đóng kết nối cũ
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }
    
    // Tạo socket mới với token được cung cấp
    const socketInstance = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000', {
      auth: { token },
      withCredentials: true,
      transports: ['websocket'],
      autoConnect: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS
    });
    
    socketInstance.on('connect', () => {
      console.log('✅ Socket connected manually:', socketInstance.id);
      setIsConnected(true);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected, reason:', reason);
      setIsConnected(false);
    });
    
    socketRef.current = socketInstance;
    setSocket(socketInstance);
    return socketInstance;
  }, []);

  // Socket service object
  const socketService = {
    emit: (event, data, callback) => {
      if (!socket || !isConnected) {
        console.warn('⚠️ Socket not connected, cannot emit:', event);
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
      connect, // Thêm hàm connect
      socketService,
      // Thêm debug info
      reduxAuthState: {
        hasUser: !!user,
        userId: user?._id,
        isAuthenticated,
        hasToken: !!accessToken
      }
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

export const useSocketService = () => {
  const { socketService } = useSocket();
  return socketService;
};