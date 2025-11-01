import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '@/redux/authSlice';
import { toast } from 'sonner';
import googleAuthService from '@/services/googleAuthService';
import { useUserContext } from '@/context/UserContext';
import { useSocket } from '@/context/SocketContext';
import { useSupportChat } from '@/context/SupportChatContext';

const GoogleAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { syncWithRedux } = useUserContext();
  const { connect: reconnectSocket } = useSocket();
  const { startConversation } = useSupportChat();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      // ✅ Handle errors with detailed messages
      if (error) {
        const errorMessages = {
          no_code: 'Không nhận được mã xác thực từ Google',
          invalid_data: 'Dữ liệu từ Google không hợp lệ',
          account_inactive: 'Tài khoản chưa được kích hoạt',
          seller_account: 'Tài khoản seller không thể đăng nhập bằng Google. Vui lòng sử dụng email/password!', // ✅ New error
          server_error: 'Lỗi server, vui lòng thử lại',
        };
        
        const errorMessage = errorMessages[error] || 'Đăng nhập Google thất bại';
        
        toast.error(errorMessage, {
          duration: error === 'seller_account' ? 5000 : 3000, // Longer duration for seller error
        });
        
        navigate('/login');
        return;
      }

      if (!accessToken || !refreshToken) {
        toast.error('Thiếu thông tin xác thực');
        navigate('/login');
        return;
      }

      // Handle successful authentication
      try {
        const result = await googleAuthService.handleGoogleCallback(
          accessToken,
          refreshToken
        );

        if (result.success && result.user) {
          // ✅ Double check role on frontend
          if (result.user.role === 'seller') {
            toast.error('Tài khoản seller không thể đăng nhập bằng Google!');
            
            // Clear tokens
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            navigate('/login');
            return;
          }

          // Update Redux state
          dispatch(setUser(result.user));
          
          // Sync with UserContext
          syncWithRedux(result.user);
          
          // Set auth type as user
          localStorage.setItem('authType', 'user');
          
          // Reconnect socket & initialize chat
          setTimeout(() => {
            console.log('🔌 Reconnecting socket after Google login');
            reconnectSocket();
            
            // Start support chat
            if (startConversation) {
              startConversation();
            }
          }, 500);
          
          // Success message
          toast.success(`Xin chào ${result.user.name}! 👋 Đăng nhập thành công!`, {
            duration: 3000,
          });
          
          // ✅ Always redirect to home (user role only)
          navigate('/');
          
        } else {
          throw new Error(result.message || 'Đăng nhập thất bại');
        }
      } catch (error) {
        console.error('Google callback error:', error);
        toast.error(error.message || 'Có lỗi xảy ra khi xử lý đăng nhập');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, dispatch, syncWithRedux, reconnectSocket, startConversation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-green-300 to-green-500">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Animated Logo */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Loading Spinner */}
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          
          {/* Text */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Đang xử lý đăng nhập
          </h2>
          <p className="text-gray-600 mb-4">
            Vui lòng chờ trong giây lát...
          </p>

          {/* Progress Steps */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <span>Xác thực với Google</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <span>Lấy thông tin tài khoản</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <span>Khởi tạo phiên làm việc</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;