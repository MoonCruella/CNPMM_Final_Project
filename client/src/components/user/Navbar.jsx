import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { assets } from "@/assets/assets";
import { useAppContext } from "../../context/AppContext.jsx";
import { useUserContext } from "../../context/UserContext.jsx";
import { toast } from "sonner";
import { useCartContext } from "@/context/CartContext.jsx";
import NotificationBell from './NotificationBell';
import { useDispatch, useSelector } from 'react-redux'; // Thêm Redux hooks
import { logoutAsync } from '../../redux/authSlice'; // Thêm Redux action

const Navbar = () => {
  const [open, setOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  // Giữ AppContext để tương thích ngược
  const { navigate: contextNavigate, logout: contextLogout, logoutAll: contextLogoutAll, openLogin } =
    useAppContext();

  // Sử dụng Redux
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, isSeller } = useSelector(state => state.auth);

  const { getUserAvatarUrl } = useUserContext();
  const getAvatarUrl = (size = 40) => {
    if (getUserAvatarUrl) {
      return getUserAvatarUrl(size);
    }

    // Fallback if getUserAvatarUrl is not available
    const name = user?.name || user?.full_name || user?.email || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=10b981&color=fff&size=${size}`;
  };

  // Logout handler sử dụng cả Redux và AppContext
  const handleLogout = async () => {
    try {
      const loadingToast = toast.loading("Đang đăng xuất...");

      // Logout qua AppContext để đảm bảo tương thích
      await contextLogout();

      // Dispatch Redux action
      await dispatch(logoutAsync()).unwrap();

      toast.dismiss(loadingToast);
      toast.success("Đăng xuất thành công");

      navigate("/");
      setOpen(false);
      setIsUserMenuOpen(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  const handleLogoutAll = async () => {
    try {
      const loadingToast = toast.loading(
        "Đang đăng xuất khỏi tất cả thiết bị..."
      );

      // Logout qua AppContext để đảm bảo tương thích
      await contextLogoutAll();

      // Dispatch Redux action
      await dispatch(logoutAsync()).unwrap();

      toast.dismiss(loadingToast);
      toast.success("Đã đăng xuất khỏi tất cả thiết bị");

      setOpen(false);
      setIsUserMenuOpen(false);
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  const handleLoginClick = () => {
    setOpen(false);
    openLogin();
    navigate("/login");
  };

  const handleMenuNavigation = (path) => {
    navigate(path);
    setIsUserMenuOpen(false);
  };

  const { items, refreshCart } = useCartContext();

  useEffect(() => {
    refreshCart(); // luôn sync lại khi load Navbar
  }, []);

  // Sử dụng Redux state cho user và isAuthenticated
  const currentUser = user; // Từ Redux state
  const userIsAuthenticated = isAuthenticated; // Từ Redux state

  return (
    <nav className="flex items-center justify-between px-6 md:px-16 lg:px-24 xl:px-32 py-4 border-b border-gray-300 bg-white relative transition-all">
      <NavLink to="/">
        <img className="h-9" src={assets.logo} alt="logo" />
      </NavLink>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center font-bold gap-8">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/products">All Products</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        <NavLink to="/blog">Blog</NavLink>
        {/* Search Bar */}
        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
          <input
            className="py-1.5 w-full bg-transparent font-normal outline-none placeholder-gray-500"
            type="text"
            placeholder="Search products"
          />
          <img
            src={assets.search_icon}
            alt="search"
            className="w-4 h-4 opacity-60 cursor-pointer"
          />
        </div>

        {/* Cart */}
        <div className="relative cursor-pointer">
          <img
            onClick={() => navigate("/cart")}
            src={assets.cart_icon}
            alt="cart"
            className="w-6 opacity-80"
          />
          <button className="absolute -top-2 -right-3 text-xs text-white btn-primary w-[18px] h-[18px] rounded-full">
            {items.length}
          </button>
        </div>
        {userIsAuthenticated && <NotificationBell />}

        {/* User Menu */}
        {!userIsAuthenticated || !currentUser ? (
          <button
            onClick={handleLoginClick}
            className="cursor-pointer px-8 py-2 btn-primary transition text-white rounded-full"
          >
            Login
          </button>
        ) : (
          <div
            className="relative"
            onMouseEnter={() => setIsUserMenuOpen(true)}
            onMouseLeave={() => setIsUserMenuOpen(false)}
          >
            {/* User Avatar with Status Indicator */}
            <div className="relative cursor-pointer">
              <img
                src={getAvatarUrl(40)}
                className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-green-500 transition-colors"
                alt="Profile"
                onError={(e) => {
                  // Better fallback handling
                  const name = currentUser?.name || currentUser?.full_name || currentUser?.email || "User";
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    name
                  )}&background=10b981&color=fff&size=40`;
                }}
              />

              {/* Active Status Indicator */}
              <div
                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${currentUser.active === true ? "bg-green-500" : "bg-red-500"
                  }`}
              ></div>
            </div>

            {/* Dropdown Menu with proper positioning and transitions */}
            <div
              className={`absolute top-12 right-0 bg-white shadow-lg border border-gray-200 py-2 w-48 rounded-md text-sm z-50 transition-all duration-200 ${isUserMenuOpen
                  ? "opacity-100 visible translate-y-0"
                  : "opacity-0 invisible -translate-y-2"
                }`}
            >
              {/* User Info Header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-medium text-gray-800 truncate">
                      {currentUser.name || currentUser.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex gap-1 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentUser.role === "admin"
                        ? "bg-red-100 text-red-700"
                        : currentUser.role === "seller"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                  >
                    {currentUser.role === "admin"
                      ? "Admin"
                      : currentUser.role === "seller"
                        ? "Seller"
                        : "User"}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${currentUser.active === true
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                      }`}
                  >
                    {currentUser.active === true ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <button
                onClick={() => handleMenuNavigation("/my-profile")}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 transition-colors"
              >
                <span>👤</span> My Profile
              </button>

              <button
                onClick={() => handleMenuNavigation("/my-orders")}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 transition-colors"
              >
                <span>📦</span> My Orders
              </button>

              {/* Admin Link */}
              {currentUser.role === "admin" && (
                <button
                  onClick={() => handleMenuNavigation("/admin")}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-purple-600 transition-colors"
                >
                  <span>⚙️</span> Admin Panel
                </button>
              )}

              {/* Seller Dashboard */}
              {currentUser.role === "seller" && (
                <button
                  onClick={() => handleMenuNavigation("/seller")}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-blue-600 transition-colors"
                >
                  <span>🏪</span> Seller Dashboard
                </button>
              )}

              <hr className="my-1" />

              {/* Logout Options */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-gray-700 transition-colors"
              >
                <span>🚪</span> Logout
              </button>

              <button
                onClick={handleLogoutAll}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2 text-red-600 transition-colors"
              >
                <span>🚫</span> Logout All Devices
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        className="sm:hidden"
      >
        <img src={assets.menu_icon} alt="menu" className="w-6 opacity-80" />
      </button>

      {/* Mobile Menu */}
      {open && (
        <div className="absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex flex-col items-start gap-2 px-5 text-sm md:hidden z-40">
          <NavLink to="/" onClick={() => setOpen(false)}>
            Home
          </NavLink>

          <NavLink to="/products" onClick={() => setOpen(false)}>
            All Products
          </NavLink>

          <NavLink to="/contact" onClick={() => setOpen(false)}>
            Contact
          </NavLink>
          <NavLink to="/blog" onClick={() => setOpen(false)}>
            Blog
          </NavLink>

          {/* User-specific mobile menu */}
          {userIsAuthenticated && currentUser ? (
            <>
              <hr className="w-full my-2" />

              {/* Mobile User Info */}
              <div className="flex items-center gap-3 py-2">
                <img
                  src={getAvatarUrl(32)}
                  className="w-8 h-8 rounded-full object-cover"
                  alt="Profile"
                  onError={(e) => {
                    const name = currentUser?.name || currentUser?.full_name || currentUser?.email || "User";
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      name
                    )}&background=10b981&color=fff&size=32`;
                  }}
                />
                <div>
                  <p className="font-medium text-gray-800">{currentUser.name || currentUser.full_name}</p>
                  <div className="flex gap-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-xs ${currentUser.active === true
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                        }`}
                    >
                      {currentUser.active === true ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <NavLink to="/my-profile" onClick={() => setOpen(false)}>
                👤 My Profile
              </NavLink>

              <NavLink to="/my-orders" onClick={() => setOpen(false)}>
                📦 My Orders
              </NavLink>

              {currentUser.role === "seller" && (
                <NavLink
                  to="/seller"
                  onClick={() => setOpen(false)}
                  className="text-blue-600"
                >
                  🏪 Seller Dashboard
                </NavLink>
              )}

              <button
                onClick={handleLogout}
                className="cursor-pointer px-6 py-2 mt-2 bg-red-600 hover:bg-red-700 transition text-white rounded-full text-sm w-full"
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLoginClick}
              className="cursor-pointer px-6 py-2 mt-2 btn-primary transition text-white rounded-full text-sm"
            >
              Login
            </button>
          )}
        </div>
      )}

      {/* Redux Debug - chỉ hiển thị trong môi trường development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="hidden fixed bottom-4 left-4 p-2 bg-white/80 backdrop-blur-sm border border-gray-300 shadow rounded text-xs text-gray-800">
          <p><strong>Redux Auth:</strong> {userIsAuthenticated ? 'Logged In' : 'Not Logged In'}</p>
          <p><strong>Role:</strong> {currentUser?.role || 'N/A'}</p>
        </div>
      )}
    </nav>
  );
};

export default Navbar;