const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const googleAuthService = {
  // Get Google OAuth URL from backend
  getGoogleAuthUrl: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/google`);
      const data = await response.json();
      
      if (data.success && data.data.url) {
        return data.data.url;
      }
      
      throw new Error('Failed to get Google OAuth URL');
    } catch (error) {
      console.error('Get Google URL error:', error);
      throw error;
    }
  },

  // Redirect to Google OAuth
  loginWithGoogle: async () => {
    try {
      const url = await googleAuthService.getGoogleAuthUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  // Handle callback from Google
  handleGoogleCallback: async (accessToken, refreshToken) => {
    try {
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Fetch user data
      const response = await fetch(`${API_BASE_URL}/api/user/get-user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }

      throw new Error('Failed to fetch user data');
    } catch (error) {
      console.error('Google callback error:', error);
      return { success: false, message: error.message };
    }
  },
};

export default googleAuthService;