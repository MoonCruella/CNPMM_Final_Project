import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast, Toaster } from 'sonner';

const formSchema = z
  .object({
    name: z.string().min(3, {
      message: 'Họ và tên phải có ít nhất 3 ký tự.',
    }),
    email: z.string().email({ message: 'Email không hợp lệ.' }),
    password: z
      .string()
      .min(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' }),
    confirm_password: z
      .string()
      .min(8, { message: 'Xác nhận mật khẩu phải có ít nhất 8 ký tự.' }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Mật khẩu và xác nhận mật khẩu phải giống nhau.',
    path: ['confirm_password'],
  });

const RegisterPage = () => {
  const [showRegisterModal, setShowRegisterModal] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      if (!baseUrl) {
        throw new Error('API base URL is not defined. Please check your .env file.');
      }

      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status) {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
        setShowRegisterModal(false);
        navigate('/login');
      } else {
        toast.error('Email đã được đăng ký!');
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error('Đã có lỗi xảy ra khi đăng ký!');
    }
  };

  const closeRegisterModal = () => {
    setShowRegisterModal(false);
    navigate('/login');
  };

  if (!showRegisterModal) return null;

  return (
    <div
      id="registerModal"
      className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target.id === 'registerModal' && closeRegisterModal()}
    >
      <Toaster richColors />
      <div className="bg-white rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-3xl font-bold mb-8 text-gray-800 text-center">Đăng ký tài khoản mới</h3>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase tracking-wide">
              Họ và tên
            </label>
            <input
              {...register('name')}
              type="text"
              className={`input-focus w-full px-5 py-4 border-2 border-gray-200 rounded-2xl transition-all duration-300 ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="Nhập họ tên"
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase tracking-wide">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className={`input-focus w-full px-5 py-4 border-2 border-gray-200 rounded-2xl transition-all duration-300 ${
                errors.email ? 'border-red-500' : ''
              }`}
              placeholder="Nhập email"
              disabled={isSubmitting}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase tracking-wide">
              Mật khẩu
            </label>
            <input
              {...register('password')}
              type="password"
              className={`input-focus w-full px-5 py-4 border-2 border-gray-200 rounded-2xl transition-all duration-300 ${
                errors.password ? 'border-red-500' : ''
              }`}
              placeholder="Tạo mật khẩu"
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase tracking-wide">
              Xác nhận mật khẩu
            </label>
            <input
              {...register('confirm_password')}
              type="password"
              className={`input-focus w-full px-5 py-4 border-2 border-gray-200 rounded-2xl transition-all duration-300 ${
                errors.confirm_password ? 'border-red-500' : ''
              }`}
              placeholder="Xác nhận mật khẩu"
              disabled={isSubmitting}
            />
            {errors.confirm_password && (
              <p className="text-red-500 text-sm mt-1">{errors.confirm_password.message}</p>
            )}
          </div>
          <button
            type="submit"
            className="btn-primary w-full text-white bg-green-600 py-4 rounded-2xl font-bold text-lg shadow-lg disabled:bg-gray-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký 🌱'}
          </button>
        </form>
        <button
          onClick={closeRegisterModal}
          className="w-full mt-4 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-all duration-300"
        >
          Hủy
        </button>
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="text-green-600 hover:text-green-800 font-bold transition-colors"
              onClick={closeRegisterModal}
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;