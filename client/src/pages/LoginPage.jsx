import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const loginSchema = z.object({
  email: z
    .string()
    .nonempty('Email hoặc số điện thoại không được để trống')
    .regex(
      /^(?:\S+@\S+\.\S+|\d{10})$/,
      'Email hoặc số điện thoại không hợp lệ'
    ),
  password: z
    .string()
    .nonempty('Mật khẩu không được để trống')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  useEffect(() => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const handleEmailFocus = () => {
      if (!emailInput.value) {
        emailInput.placeholder = 'VD: demo@quehuong.vn hoặc 0123456789';
      }
    };

    const handlePasswordFocus = () => {
      if (!passwordInput.value) {
        passwordInput.placeholder = 'VD: demo123 (bất kỳ mật khẩu nào)';
      }
    };

    emailInput.addEventListener('focus', handleEmailFocus);
    passwordInput.addEventListener('focus', handlePasswordFocus);

    return () => {
      emailInput.removeEventListener('focus', handleEmailFocus);
      passwordInput.removeEventListener('focus', handlePasswordFocus);
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Validate with zod
      loginSchema.parse({ email, password });

      if (!baseUrl) {
        throw new Error('API base URL is not defined. Please check your .env file.');
      }

      setIsLoading(true);
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsLoading(false);

      if (data.status) {
        toast.success('Login Success!');
        setShowSuccessModal(true);
        navigate('/dashboard');
      } else {
        toast.error('Invalid Login!');
      }
    } catch (error) {
      setIsLoading(false);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Login error:', error);
        toast.error('Invalid Login!');
      }
    }
  };

  const togglePassword = () => {
    setPasswordVisible(!passwordVisible);
  };

  const showForgotPassword = () => {
    toast.info(
      'Tính năng quên mật khẩu sẽ được cập nhật sớm! 🔄\n\nTrong demo này, bạn có thể nhập bất kỳ thông tin nào để đăng nhập.'
    );
  };

  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 relative">
      {/* Background decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full blur-xl"></div>
      <div className="absolute bottom-20 right-20 w-32 h-32 bg-white bg-opacity-5 rounded-full blur-2xl"></div>
      <div className="absolute top-1/3 right-10 w-16 h-16 bg-green-300 bg-opacity-20 rounded-full blur-lg"></div>

     

      {/* Form container */}
      <div className="form-container rounded-3xl shadow-2xl p-10 w-full max-w-md relative z-10 bg-white">
        <div className="text-center mb-10">
          <div className="floating-animation inline-block mb-6">
            <div className="w-20 h-20 leaf-icon rounded-full flex items-center justify-center mx-auto shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                <path d="M12 16C12 16 8 20 8 22C8 23.1 8.9 24 10 24H14C15.1 24 16 23.1 16 22C16 20 12 16 12 16Z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Chào mừng trở lại!</h1>
          <p className="text-gray-600 text-lg">Đăng nhập vào Phú Yên Store</p>
          <div className="w-16 h-1 bg-gradient-to-r from-green-500 to-green-600 mx-auto mt-4 rounded-full"></div>
        </div>

        <form id="loginForm" className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide">Email hoặc số điện thoại</label>
            <div className="relative">
              <input
                id="email"
                type="text"
                className="input-focus w-full px-5 py-4 pl-14 border-2 border-gray-200 rounded-2xl transition-all duration-300 text-gray-700 placeholder-gray-400"
                placeholder="Nhập email hoặc SĐT"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide">Mật khẩu</label>
            <div className="relative">
              <input
                id="password"
                type={passwordVisible ? 'text' : 'password'}
                className="input-focus w-full px-5 py-4 pl-14 pr-14 border-2 border-gray-200 rounded-2xl transition-all duration-300 text-gray-700 placeholder-gray-400"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M12,17c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,17,12,17z M15.1,8H8.9V6c0-1.71,1.39-3.1,3.1-3.1s3.1,1.39,3.1,3.1V8z" />
                </svg>
              </div>
              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <span className="ml-3 text-sm text-gray-600 font-medium">Ghi nhớ đăng nhập</span>
            </label>
            <button
              type="button"
              onClick={showForgotPassword}
              className="text-sm text-green-600 hover:text-green-800 font-semibold transition-colors"
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            type="submit"
            className="btn-primary w-full text-white bg-green-600 py-4 rounded-2xl font-bold text-lg shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Đang đăng nhập... ⏳' : 'Đăng nhập 🌿'}
          </button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">Hoặc đăng nhập với</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              onClick={() => socialLogin('Google')}
              className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-300"
            >
              <span className="mr-2 text-lg">🔍</span>
              <span className="text-sm font-semibold text-gray-700">Google</span>
            </button>
            <button
              onClick={() => socialLogin('Facebook')}
              className="flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-300"
            >
              <span className="mr-2 text-lg">📘</span>
              <span className="text-sm font-semibold text-gray-700">Facebook</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="text-green-600 hover:text-green-800 font-bold transition-colors"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;