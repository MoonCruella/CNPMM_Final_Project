import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";

const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email hoặc số điện thoại không được để trống")
    .regex(
      /^(?:\S+@\S+\.\S+|\d{10})$/,
      "Email hoặc số điện thoại không hợp lệ"
    ),
  password: z
    .string()
    .nonempty("Mật khẩu không được để trống")
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
});

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, navigate } = useAppContext();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ email, password });
      setIsLoading(true);

      await login(email, password);
      navigate("/");
      

    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.response?.status === 401) {
        toast.error("Email hoặc mật khẩu không đúng");
      } else if (error.response) {
        toast.error(error.response.data.message || "Đăng nhập thất bại!");
      } else {
        toast.error("Lỗi kết nối tới server!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-green-300 to-green-500 relative">
      <div className="w-full max-w-5xl flex bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Banner trái */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-green-600 to-green-800 text-white items-center justify-center p-10">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">🌿 Phú Yên Store</h2>
            <p className="text-lg leading-relaxed">
              Mua sắm sản phẩm chất lượng <br /> với trải nghiệm tuyệt vời.
            </p>
          </div>
        </div>

        {/* Form phải */}
        <div className="w-full md:w-1/2 p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Chào mừng trở lại!
            </h1>
            <p className="text-gray-600">Đăng nhập để tiếp tục</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Email hoặc SĐT
              </label>
              <input
                type="text"
                name="email"
                autoComplete="email"
                className="w-full px-5 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 outline-none"
                placeholder="Nhập email hoặc số điện thoại"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  className="w-full px-5 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 outline-none"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {passwordVisible ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex justify-between items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-green-600 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Ghi nhớ đăng nhập
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-green-600 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-md disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Social login */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center">
              <span className="bg-white px-4 text-gray-500">
                Hoặc đăng nhập với
              </span>
              <div className="absolute w-full border-t border-gray-200"></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button className="py-3 border-2 border-gray-200 rounded-xl hover:border-green-400">
                🔍 Google
              </button>
              <button className="py-3 border-2 border-gray-200 rounded-xl hover:border-green-400">
                📘 Facebook
              </button>
            </div>
          </div>

          {/* Register link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-green-600 hover:text-green-800 font-bold"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;