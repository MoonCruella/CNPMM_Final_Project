import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const TokenTest = () => {
  const { 
    isAuthenticated, 
    enableTokenTestMode, 
    disableTokenTestMode, 
    isTokenTestMode,
    forceRefreshToken
  } = useAppContext();
  
  const [tokenInfo, setTokenInfo] = useState({
    token: localStorage.getItem('accessToken') || 'Không có token',
    isValid: false,
    timeRemaining: 0,
    formattedTime: '00:00'
  });

  // Cập nhật thông tin token mỗi giây
  useEffect(() => {
    const checkToken = () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setTokenInfo({
            token: 'Không có token',
            isValid: false,
            timeRemaining: 0,
            formattedTime: '00:00'
          });
          return;
        }
        
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        const timeRemaining = payload.exp * 1000 - Date.now();
        const valid = timeRemaining > 0;
        
        // Format thời gian còn lại
        const seconds = Math.floor(Math.abs(timeRemaining) / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        const displayTime = timeRemaining < 0 ? `-${formattedTime}` : formattedTime;
        
        setTokenInfo({
          token: token.substring(0, 20) + '...',
          isValid: valid,
          timeRemaining,
          formattedTime: displayTime
        });
      } catch (error) {
        console.error('Lỗi khi kiểm tra token:', error);
      }
    };
    
    checkToken();
    const intervalId = setInterval(checkToken, 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">Bạn cần đăng nhập để test refresh token</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Token Refresh Tester</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-lg mb-2">Thông tin Token</h2>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium">Trạng thái:</div>
          <div className={tokenInfo.isValid ? "text-green-600" : "text-red-600"}>
            {tokenInfo.isValid ? "Còn hiệu lực" : "Hết hạn"}
          </div>
          
          <div className="font-medium">Thời gian còn lại:</div>
          <div>{tokenInfo.formattedTime}</div>
          
          <div className="font-medium">Token:</div>
          <div className="truncate text-sm text-gray-600">{tokenInfo.token}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => {
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyM30.sLGRfOhxWgayF8YCwJRFUO33KzRb8XK39WEUQ6f25-g';
            localStorage.setItem('accessToken', expiredToken);
          }}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
        >
          1. Làm hết hạn token
        </button>
        
        <button
          onClick={forceRefreshToken}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          2. Test refresh thủ công
        </button>
        
        <button
          onClick={() => {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            
            fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          3. Test với API call
        </button>
      </div>
    </div>
  );
};

export default TokenTest;