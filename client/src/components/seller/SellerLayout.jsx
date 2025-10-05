import {
  IconBellRinging,
  IconFingerprint,
  IconKey,
  IconLogout,
  IconReceipt2,
  IconMessages,
} from "@tabler/icons-react";
import { assets } from "../../assets/assets";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import SellerNotificationBell from "./SellerNotificationBell";
import { toast } from "sonner";
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';

const SellerLayout = () => {
  const { logoutAll } = useAppContext();
  const location = useLocation();
  const activePath = location.pathname;
  const navigate = useNavigate(); // Sử dụng hook useNavigate
  const dispatch = useDispatch(); // Sử dụng dispatch để gọi action
  const data = [
    { link: "/seller", label: "Dashboard", icon: IconReceipt2 },
    {
      link: "/seller/notifications",
      label: "Notifications",
      icon: IconBellRinging,
    },
    { link: "/seller/products", label: "Product List", icon: IconReceipt2 },
    { link: "/seller/orders", label: "Orders", icon: IconFingerprint },
    { link: "/seller/vouchers", label: "Vouchers", icon: IconKey },
    { link: "/seller/support", label: "Support Chat", icon: IconMessages },
    { link: "/seller/my-account", label: "My Account", icon: IconKey },
    { link: "/seller/manage-user", label: "Quản lý người dùng", icon: IconKey },
    {
      label: 'Quản lý Blog',
      icon: (
        IconKey
      ),
      link: '/seller/blog',
      active: activePath === '/seller/blog', // Thay pathname bằng activePath
    },
  ];

  

  // Cập nhật logout handler để chuyển hướng về trang đăng nhập với mode=seller
  const handleLogout = async () => {
    try {
      const loadingToast = toast.loading("Đang đăng xuất...");

      // Logout thông qua AppContext
      await logoutAll();

      // Đồng thời dispatch logout action trong Redux
      dispatch(logout());

      toast.dismiss(loadingToast);
      // Chuyển hướng đến trang login với mode=seller
      navigate("/login?mode=seller");
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  return (
    <div className="flex h-screen font-medium">
      {/* Sidebar */}
      <nav className="h-full w-[280px] p-6 flex flex-col bg-gray-900">
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 mb-9 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <img
                src={assets.logo}
                alt="Logo"
                className="w-10 h-10 rounded-lg"
              />
              <span className="text-white font-medium text-xl">Pyspecials</span>
            </div>
            <span className="bg-gray-800 text-gray-200 text-sm px-2 py-1 rounded font-bold">
              v1.0.0
            </span>
          </div>

          {/* Links */}
          <div className="space-y-1">
            {data.map((item) => {
              const isActive = activePath === item.link;
              return (
                <Link
                  to={item.link}
                  key={item.label}
                  className={`flex items-center text-sm px-4 py-3 rounded-md font-medium transition-colors
                    ${isActive
                      ? "bg-white text-gray-900 shadow"
                      : "text-gray-300 hover:bg-gray-800"
                    }`}
                >
                  <item.icon
                    stroke={1.5}
                    className={`mr-4 w-6 h-6 ${isActive ? "text-gray-700" : "text-gray-400"
                      }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-sm text-gray-200 px-4 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            <IconLogout className="mr-4 w-6 h-6 text-gray-400" stroke={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Header Bar */}
        <div className="bg-white shadow-sm p-4 flex justify-between items-center border-b">
          <h1 className="text-xl font-semibold text-green-700">
            {data.find(item => item.link === activePath || activePath.startsWith(item.link + '/'))?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <SellerNotificationBell />
          </div>
        </div>

        {/* Content Area - scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerLayout;
