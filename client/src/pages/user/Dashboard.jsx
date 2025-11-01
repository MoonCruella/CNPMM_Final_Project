import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import WishListProduct from "../../components/user/WishListProduct";
import ViewRecent from "../../components/user/ViewRecent";
import NotificationsPanel from "../../components/user/NotificationsPanel";
import ProfilePage from "./ProfilePage";
import MyOrdersPage from "./MyOrderPage";
import OrderDetailPage from "./OrderDetailPage"; 
import userService from "../../services/user.service";
import { onUserUpdated } from "../../utils/events";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams(); 
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setIsLoading] = useState(true);

  const getActiveSection = () => {
    const path = location.pathname;

    if (path.includes('/user/orders/') && orderId) return 'order-detail';

    if (path.includes('/user/notifications')) return 'notifications';
    if (path.includes('/user/account/profile')) return 'profile';
    if (path.includes('/user/account')) return 'account';
    if (path.includes('/user/orders')) return 'orders';
    if (path.includes('/user/wishlist')) return 'wishlist';
    if (path.includes('/user/recent')) return 'recent';
    return 'wishlist';
  };

  const activeSection = getActiveSection();

  useEffect(() => {
    if (activeSection === 'profile' || activeSection === 'account') {
      setAccountMenuOpen(true);
    }
  }, [activeSection]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await userService.getCurrentUser();

        if (response.success && response.user) {
          const userData = {
            _id: response.user.userId,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            coin: response.user.coin,
            active: response.user.active,
            phone: response.user.phone,
            gender: response.user.gender,
            date_of_birth: response.user.date_of_birth,
            avatar: response.user.avatar,
            address: response.user.address,
          };

          console.log('Dashboard - User loaded:', userData);
          setUser(userData);
        }
      } catch (error) {
        console.error("Dashboard - Fetch user error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await userService.getCurrentUser();
      if (response.success && response.user) {
        const userData = {
          _id: response.user.userId,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          coin: response.user.coin,
          active: response.user.active,
          phone: response.user.phone,
          gender: response.user.gender,
          date_of_birth: response.user.date_of_birth,
          avatar: response.user.avatar,
          address: response.user.address,
        };

        console.log('Dashboard - User loaded:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error("Dashboard - Fetch user error:", error);
    }
  };

  useEffect(() => {
    const cleanup = onUserUpdated(() => {
      console.log('🔄 Dashboard - User updated event received, refreshing...');
      fetchUserData();
    });

    return cleanup;
  }, []);

  const getAvatarUrl = (size = 40) => {
    if (user?.avatar) {
      if (user.avatar.includes('cloudinary.com')) {
        const parts = user.avatar.split('/upload/');
        if (parts.length === 2) {
          return `${parts[0]}/upload/w_${size},h_${size},c_fill,q_auto,f_auto/${parts[1]}`;
        }
      }
      return user.avatar;
    }

    const name = user?.name || user?.email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&size=${size}`;
  };

  const handleNavigation = (section) => {
    navigate(`/user/${section}`);
    setSidebarOpen(false);
  };

  const toggleAccountMenu = () => {
    setAccountMenuOpen(!accountMenuOpen);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "wishlist":
        return <WishListProduct />;
      case "recent":
        return <ViewRecent />;
      case "profile":
        return <ProfilePage />;
      case "account":
        return null;
      case "orders":
        return <MyOrdersPage />;
      case "order-detail":
        return <OrderDetailPage />;
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
    {/* Mobile Header - User Info Summary */}
    <div className="md:hidden px-4 py-4">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex items-center">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-3">
          <img
            src={getAvatarUrl(40)}
            alt={user?.name || "User"}
            className="w-full h-full rounded-full object-cover"
            onError={(e) => {
              e.target.src = getAvatarUrl(40);
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

    <div className="flex min-h-screen gap-6 py-6 ms-16">
      
      <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 lg:w-72 flex-shrink-0`}>
        <div className="sticky top-4 pl-6 pr-4 space-y-4"> 
          
          {/* User Info Card - Desktop Only */}
          <div className="hidden md:block bg-white rounded-xl shadow-md p-5"> 
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3 ring-4 ring-green-50"> 
                <img
                  src={getAvatarUrl(80)}
                  alt={user?.name || "User"}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = getAvatarUrl(80);
                  }}
                />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">{user?.name}</h2>
              <p className="text-sm text-gray-500 mb-4">{user?.email}</p> 
              <button
                onClick={() => navigate("/user/account/profile")}
                className="w-full px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-5 py-3 bg-green-700 text-white font-semibold text-sm"> 
              Menu
            </div>
            <nav className="py-2">
              {/* Notifications */}
              <button
                onClick={() => handleNavigation("notifications")}
                className={`w-full flex items-center px-5 py-3 text-left cursor-pointer transition-all duration-200 ${
                  activeSection === "notifications"
                    ? "bg-green-50 text-green-700 font-semibold border-l-4 border-green-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <span className="text-sm">Thông báo</span>
              </button>

              {/* Account Menu with Submenu */}
              <div>
                <button
                  onClick={toggleAccountMenu}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left cursor-pointer transition-all duration-200 ${
                    activeSection === "account" || activeSection === "profile"
                      ? "bg-green-50 text-green-700 font-semibold border-l-4 border-green-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span className="text-sm">Tài khoản của tôi</span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className={`w-4 h-4 transition-transform duration-200 ${accountMenuOpen ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Submenu */}
                {accountMenuOpen && (
                  <div className="bg-gray-50">
                   
                    <button
                      onClick={() => handleNavigation("account/profile")}
                      className={`w-full flex items-center px-5 py-2.5 pl-12 text-left text-sm cursor-pointer transition-all duration-200 ${
                        activeSection === "profile"
                          ? "text-green-700 font-semibold bg-green-100"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                      Hồ sơ cá nhân
                    </button>
                     <button
                      onClick={() => navigate("/change-password")}
                      className={`w-full flex items-center px-5 py-2.5 pl-12 text-left text-sm cursor-pointer transition-all duration-200 ${
                        activeSection === "account" && !location.pathname.includes('/profile')
                          ? "text-green-700 font-semibold bg-green-100"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                      </svg>
                      Đổi mật khẩu
                    </button>
                  </div>
                )}
              </div>

              {/* Orders */}
              <button
                onClick={() => handleNavigation("orders")}
                className={`w-full flex items-center px-5 py-3 text-left cursor-pointer transition-all duration-200 ${
                  activeSection === "orders" || activeSection === "order-detail"
                    ? "bg-green-50 text-green-700 font-semibold border-l-4 border-green-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <span className="text-sm">Đơn hàng của tôi</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={() => handleNavigation("wishlist")}
                className={`w-full flex items-center px-5 py-3 text-left cursor-pointer transition-all duration-200 ${
                  activeSection === "wishlist"
                    ? "bg-green-50 text-green-700 font-semibold border-l-4 border-green-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span className="text-sm">Sản phẩm yêu thích</span>
              </button>

              {/* Recent */}
              <button
                onClick={() => handleNavigation("recent")}
                className={`w-full flex items-center px-5 py-3 text-left cursor-pointer transition-all duration-200 ${
                  activeSection === "recent"
                    ? "bg-green-50 text-green-700 font-semibold border-l-4 border-green-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                <span className="text-sm">Đã xem gần đây</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0  pr-6"> 
        {renderContent()}
      </main>
    </div>
  </div>
);
};

export default Dashboard;