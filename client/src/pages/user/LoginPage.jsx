import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, loginSeller, clearError } from "../../redux/authSlice";
import { useUserContext } from "../../context/UserContext.jsx";
import { useSocket } from "../../context/SocketContext";
import { useSupportChat } from "../../context/SupportChatContext";
import googleAuthService from "../../services/googleAuthService";

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
  const [isSellerLogin, setIsSellerLogin] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); 

  const { syncWithRedux } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, loading, error, isAuthenticated, isSeller } = useSelector(
    (state) => state.auth
  );
  const { connect: reconnectSocket } = useSocket();
  const { startConversation } = useSupportChat();

  // Kiểm tra nếu có tham số mode=seller trong URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get("mode");
    if (mode === "seller") {
      setIsSellerLogin(true);
    }
  }, [location]);

  // Kiểm tra nếu có thông tin đã lưu
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Xử lý redirect khi đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from || (isSeller ? "/seller" : "/");
      navigate(from);

      const welcomeMessage = isSeller
        ? `Chào mừng người bán ${user?.full_name || user?.email} quay trở lại!`
        : `Chào mừng ${user?.full_name || user?.email} quay trở lại!`;

      toast.success(welcomeMessage);
    }
  }, [isAuthenticated, isSeller, navigate, location, user]);

  // Clear error khi component unmount hoặc khi chuyển tab
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [dispatch, error, isSellerLogin]);

  // Hiển thị thông báo lỗi từ Redux
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      loginSchema.parse({ email, password });

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      let result;
      if (isSellerLogin) {
        localStorage.setItem("authType", "seller");
        result = await dispatch(loginSeller({ email, password })).unwrap();
      } else {
        localStorage.setItem("authType", "user");
        result = await dispatch(loginUser({ email, password })).unwrap();
      }

      if (result && result._id) {
        syncWithRedux(result);

        setTimeout(() => {
          if (result?.accessToken) {
            console.log("🔌 Reconnecting socket after login");
            reconnectSocket();
          }

          if (!isSellerLogin && startConversation) {
            startConversation();
          }
        }, 500);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  // Add handleGoogleLogin function
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await googleAuthService.loginWithGoogle();
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Không thể đăng nhập với Google. Vui lòng thử lại!");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-200 via-green-300 to-green-500 relative">
      <div className="w-full max-w-5xl flex bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Banner trái */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-green-600 to-green-800 text-white items-center justify-center p-10">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">🌿 Pyspecials</h2>
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

          {/* Toggle đăng nhập User/Seller */}
          <div className="flex border rounded-lg mb-6 overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 ${
                !isSellerLogin
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => setIsSellerLogin(false)}
            >
              Khách hàng
            </button>
            <button
              type="button"
              className={`flex-1 py-2 ${
                isSellerLogin
                  ? "bg-green-500 text-white"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => setIsSellerLogin(true)}
            >
              Người bán
            </button>
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
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
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
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span>Đang đăng nhập...</span>
                </div>
              ) : isSellerLogin ? (
                "Đăng nhập người bán"
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Social login - CHỈ hiển thị khi đăng nhập USER */}
          {!isSellerLogin && (
            <div className="mt-8">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-full border-t border-gray-300"></div>
                <span className="relative bg-white px-4 text-gray-500 text-sm">
                  Hoặc đăng nhập với
                </span>
              </div>

              {/* Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-green-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-700 font-medium">
                      Đang kết nối...
                    </span>
                  </>
                ) : (
                  <>
                    {/* Google Icon */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-gray-700 font-medium">
                      Đăng nhập với Google
                    </span>
                  </>
                )}
              </button>

              {/* Add helpful note */}
              <p className="text-xs text-gray-500 text-center mt-3">
                Chỉ dành cho khách hàng. Đăng nhập nhanh và bảo mật với Google.
              </p>
            </div>
          )}

          {/* Register link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              {isSellerLogin ? (
                <>
                  Bạn muốn trở thành người bán?{" "}
                  <Link
                    to="/register-seller"
                    className="text-green-600 hover:text-green-800 font-bold"
                  >
                    Đăng ký tại đây
                  </Link>
                </>
              ) : (
                <>
                  Chưa có tài khoản?{" "}
                  <Link
                    to="/register"
                    className="text-green-600 hover:text-green-800 font-bold"
                  >
                    Đăng ký ngay
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
