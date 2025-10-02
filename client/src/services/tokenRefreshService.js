import { refreshToken } from './api';

// Hàm kiểm tra thời gian còn lại của token
export const getTokenTimeRemaining = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return 0;
    
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    
    const timeRemaining = payload.exp * 1000 - Date.now();
    return timeRemaining;
  } catch (error) {
    console.error('Lỗi khi tính thời gian token:', error);
    return 0;
  }
};

// Thiết lập tự động refresh token - CHẾ ĐỘ TEST
export const setupAutoRefreshForTesting = () => {
  
  if (window.tokenRefreshInterval) {
    clearInterval(window.tokenRefreshInterval);
  }
  
  // Trong chế độ test: kiểm tra mỗi 10 giây, refresh nếu còn dưới 20 giây
  window.tokenRefreshInterval = setInterval(async () => {
    try {
      const timeRemaining = getTokenTimeRemaining();
      // Giá trị test: 20 giây
      const TEST_THRESHOLD = 20 * 1000;
      
      if (timeRemaining > 0 && timeRemaining < TEST_THRESHOLD) {
        const newToken = await refreshToken();
      }
    } catch (error) {
      console.error('Lỗi khi tự động refresh token:', error);
    }
  }, 10000); // Kiểm tra mỗi 10 giây
  
  return () => {
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
    }
  };
};

// Thiết lập tự động refresh token - CHẾ ĐỘ PRODUCTION
export const setupAutoRefresh = () => {
  
  if (window.tokenRefreshInterval) {
    clearInterval(window.tokenRefreshInterval);
  }
  
  // Trong thực tế: kiểm tra mỗi phút, refresh nếu còn dưới 5 phút
  window.tokenRefreshInterval = setInterval(async () => {
    try {
      const timeRemaining = getTokenTimeRemaining();
      // Giá trị thực tế: 5 phút
      const PROD_THRESHOLD = 5 * 60 * 1000;
      
      if (timeRemaining > 0 && timeRemaining < PROD_THRESHOLD) {
        await refreshToken();
      }
    } catch (error) {
    }
  }, 60000); // Kiểm tra mỗi 1 phút
  
  return () => {
    if (window.tokenRefreshInterval) {
      clearInterval(window.tokenRefreshInterval);
    }
  };
};