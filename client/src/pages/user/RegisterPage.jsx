import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast, Toaster } from "sonner";
import authService from "../../services/authService";

// Schema validate
const formSchema = z
  .object({
    name: z.string().min(3, { message: "Họ và tên phải có ít nhất 3 ký tự." }),
    email: z.string().email({ message: "Email không hợp lệ." }),
    password: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự." }),
    confirm_password: z
      .string()
      .min(8, { message: "Xác nhận mật khẩu phải có ít nhất 8 ký tự." }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Mật khẩu và xác nhận mật khẩu phải giống nhau.",
    path: ["confirm_password"],
  });

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setLoading(true);
      const res = await authService.register(values);

      if (res.data.success) {
        toast.success("Đã gửi mã OTP đến email của bạn!");
        navigate("/verify-otp", {
          state: { email: values.email, mode: "register" },
        });
      } else {
        toast.error(res.data.message || "Email đã được đăng ký!");
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error(
        error.response?.data?.message || "Đã có lỗi xảy ra khi đăng ký!"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 to-green-50 p-4">
      <Toaster richColors />
      <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl">
        <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">
          Đăng ký tài khoản mới
        </h2>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          {/* Họ và tên */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Họ và tên
            </label>
            <input
              {...register("name")}
              type="text"
              placeholder="Nhập họ tên"
              className={`w-full px-5 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 ${
                errors.name ? "border-red-500" : "border-gray-200"
              }`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="Nhập email"
              className={`w-full px-5 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 ${
                errors.email ? "border-red-500" : "border-gray-200"
              }`}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Mật khẩu
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="Tạo mật khẩu"
              className={`w-full px-5 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 ${
                errors.password ? "border-red-500" : "border-gray-200"
              }`}
              disabled={loading}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Xác nhận mật khẩu
            </label>
            <input
              {...register("confirm_password")}
              type="password"
              placeholder="Xác nhận mật khẩu"
              className={`w-full px-5 py-3 border-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 ${
                errors.confirm_password ? "border-red-500" : "border-gray-200"
              }`}
              disabled={loading}
            />
            {errors.confirm_password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          {/* Nút đăng ký */}
          <button
            type="submit"
            className="w-full text-white bg-green-600 py-3 rounded-2xl font-bold text-lg shadow-lg hover:bg-green-700 transition-all disabled:bg-gray-400"
            disabled={loading}
          >
            {loading ? "Đang đăng ký..." : "Đăng ký 🌱"}
          </button>
        </form>

        {/* Link đăng nhập */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-green-600 hover:text-green-800 font-bold"
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
