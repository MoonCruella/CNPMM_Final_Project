import {
  IconBellRinging,
  IconFingerprint,
  IconKey,
  IconLogout,
  IconReceipt2,
} from "@tabler/icons-react";
import { assets } from "../../assets/assets";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext.jsx";
import { toast } from "sonner";

const SellerLayout = () => {
  const data = [
    { link: "/seller", label: "Dashboard", icon: IconReceipt2 },
    {
      link: "/seller/notifications",
      label: "Notifications",
      icon: IconBellRinging,
    },
    { link: "/seller/products", label: "Product List", icon: IconReceipt2 },
    { link: "/seller/orders", label: "Orders", icon: IconFingerprint },
    { link: "/seller/my-account", label: "My Account", icon: IconKey },
  ];

  const { navigate, logout } = useAppContext();
  const location = useLocation();
  const activePath = location.pathname;

  // Logout handler
  const handleLogout = async () => {
    try {
      const loadingToast = toast.loading("Đang đăng xuất...");
      await logout();
      toast.dismiss(loadingToast);
      navigate("/seller"); // điều hướng về trang login dành cho seller
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <nav className="h-screen w-[280px] p-6 flex flex-col bg-green-700">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 mb-9 border-b border-green-800">
            <div className="flex items-center gap-2">
              <img
                src={assets.logo}
                alt="Logo"
                className="w-10 h-10 rounded-lg"
              />
              <span className="text-white font-bold text-xl">Pyspecials</span>
            </div>
            <span className="bg-green-800 text-white text-sm px-2 py-1 rounded font-bold">
              v1.0.0
            </span>
          </div>

          {/* Links */}
          {data.map((item) => {
            const isActive = activePath === item.link;
            return (
              <Link
                to={item.link}
                key={item.label}
                className={`flex items-center text-sm px-4 py-3 rounded-md font-medium transition-colors
                  ${
                    isActive
                      ? "bg-white text-green-800 shadow"
                      : "text-white hover:bg-green-800"
                  }`}
              >
                <item.icon
                  stroke={1.5}
                  className={`mr-4 w-6 h-6 ${
                    isActive ? "text-green-700" : "text-sky-300"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 border-t border-green-800">
          <button
            onClick={handleLogout}
            className="flex items-center w-full text-sm text-white px-4 py-3 rounded-md font-medium hover:bg-green-800"
          >
            <IconLogout className="mr-4 w-6 h-6 text-sky-300" stroke={1.5} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Nội dung trang con */}
      <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;
