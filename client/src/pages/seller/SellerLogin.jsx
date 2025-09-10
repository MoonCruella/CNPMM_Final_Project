import { React, useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "sonner";
const SellerLogin = () => {
  const { isSeller, loginSeller, navigate } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem("authType", "seller");
      const result = await loginSeller(email, password);
      if (result.success) {
        toast.success("Đăng nhập thành công!");
        navigate("/seller");
      } else {
        toast.error(result?.message || "Đăng nhập thất bại!");
      }
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
      setLoading(false);
    }
  };
  useEffect(() => {
    if (isSeller) {
      navigate("/seller");
    }
  }, [isSeller, navigate]);
  return (
    !isSeller && (
      <form
        onSubmit={onSubmitHandler}
        className="min-h-screen flex items-center text-sm text-gray-600"
      >
        <div
          className="flex flex-col gap-5 m-auto items-start p-8 py-12 min-w-80 sm:min-w-88
rounded-lg shadow-xl border border-gray-200"
        >
          <p className="text-2xl font-medium m-auto">
            <span className="text-primary">Seller</span> Login
          </p>
          <div className="w-full ">
            <p>Email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="enter you email"
              className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
              required
            />
          </div>
          <div className="w-full ">
            <p>Password</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="enter your password"
              className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
              required
            />
          </div>
          <button
            disabled={loading}
            className="bg-primary text-white w-full py-2 rounded-md cursor-pointer"
          >
            {loading ? "Đang đăng nhập..." : "Login"}
          </button>
        </div>
      </form>
    )
  );
};

export default SellerLogin;
