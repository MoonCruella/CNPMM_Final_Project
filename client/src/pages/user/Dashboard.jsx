import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import WishListProduct from "../../components/user/WishListProduct";
import ViewRecent from "../../components/user/ViewRecent";
import { assets } from "@/assets/assets";
import { useAppContext } from "../../context/AppContext";
import { useUserContext } from "../../context/UserContext";
import NotificationsPanel from "../../components/user/NotificationsPanel";
const Dashboard = () => {
  const { user, isAuthenticated, loading, navigate } = useAppContext();
  const [activeSection, setActiveSection] = useState("wishlist");
  const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile toggle
  const { getUserAvatarUrl } = useUserContext();

  const getAvatarUrl = (size = 40) => {
    if (getUserAvatarUrl) {
      return getUserAvatarUrl(size);
    }

    const name = user?.name || user?.email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=10b981&color=fff&size=${size}`;
  };

  const renderContent = () => {
    switch (activeSection) {
      case "wishlist":
        return <WishListProduct />;
      case "recent":
        return <ViewRecent />;
      case "account":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Thông tin tài khoản</h2>
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>
        );
      case "orders":
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Đơn hàng của tôi</h2>
            <p className="text-gray-500">Chưa có đơn hàng nào.</p>
          </div>
        );
      case "notifications":
       return <NotificationsPanel />;  
      default:
        return <WishListProduct />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* User Info Summary - Mobile Only */}
      <div className="md:hidden max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3">
            {/* Cập nhật phần avatar ở đây */}
            <img
              src={getAvatarUrl(40)}
              alt={user?.name || "User"}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                // Better fallback handling
                const name = user?.name || user?.email || "User";
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  name
                )}&background=10b981&color=fff&size=40`;
              }}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.name}</h2>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto bg-gray-100 p-2 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar - Desktop always visible, mobile toggleable */}
        <div className={`md:block ${sidebarOpen ? 'block' : 'hidden'} w-full md:w-64 shrink-0`}>
          {/* User Info - Desktop Only */}
          <div className="hidden md:block bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3">
                {/* Cập nhật phần avatar ở đây */}
                <img
                  src={getAvatarUrl(80)} 
                  alt={user?.name || "User"}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    // Better fallback handling
                    const name = user?.name || user?.email || "User";
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      name
                    )}&background=10b981&color=fff&size=80`;
                  }}
                />
              </div>
              <h2 className="text-lg font-semibold">{user?.name}</h2>
              <p className="text-sm text-gray-600 mb-3">{user?.email}</p>
              <button 
                onClick={() => navigate("/profile")}
                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-green-700 text-white font-medium">
              Menu
            </div>
            <nav className="py-2">
              <button
                onClick={() => setActiveSection("notifications")}
                className={`w-full flex items-center px-4 py-3 text-left ${activeSection === "notifications"
                    ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                Thông báo
              </button>
              <button
                onClick={() => setActiveSection("account")}
                className={`w-full flex items-center px-4 py-3 text-left ${activeSection === "account"
                    ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                Tài khoản của tôi
              </button>
              <button
                onClick={() => setActiveSection("orders")}
                className={`w-full flex items-center px-4 py-3 text-left ${activeSection === "orders"
                    ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                Đơn hàng của tôi
              </button>
              <button
                onClick={() => setActiveSection("wishlist")}
                className={`w-full flex items-center px-4 py-3 text-left ${activeSection === "wishlist"
                    ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                Sản phẩm yêu thích
              </button>
              <button
                onClick={() => setActiveSection("recent")}
                className={`w-full flex items-center px-4 py-3 text-left ${activeSection === "recent"
                    ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Đã xem gần đây
              </button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-6">
            {activeSection === "wishlist"}
            {activeSection === "recent"}
            {activeSection === "account"}
            {activeSection === "orders"}
            {activeSection === "notifications"}
          </h2>

          {/* Render the active section content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;