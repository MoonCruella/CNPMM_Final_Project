import React, { useEffect } from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import LoginPage from "./pages/user/LoginPage";
import RegisterPage from "./pages/user/RegisterPage";
import Dashboard from "./pages/user/Dashboard";
import HomePage from "./pages/user/HomePage";
import { Route, Routes, useLocation, Navigate } from "react-router";
import { Toaster } from "./components/ui/sonner";
import ForgotPasswordPage from "./pages/user/ForgotPasswordPage";
import ProfilePage from "./pages/user/ProfilePage";
import VerifyOTPPage from "./pages/user/VerifyOTPPage";
import NewPasswordPage from "./pages/user/NewPasswordPage";
import Navbar from "./components/user/Navbar";
import Footer from "./components/user/Footer";
import UploadImages from "./components/user/UploadImages";
import CartPage from "./pages/user/CartPage";
import AllProducts from "./pages/user/AllProducts";
import MyOrdersPage from "./pages/user/MyOrderPage";
import CheckoutPage from "./pages/user/CheckoutPage";
import ProductDetails from "./pages/user/ProductDetails";
import SellerLayout from "./components/seller/SellerLayout";
import ProductList from "./components/seller/ProductList";
import Orders from "./components/seller/Orders";
import Notifications from "./components/seller/Notifications";
import MyAccount from "./components/seller/MyAccount";
import DashboardSeller from "./components/seller/DashboardSeller";
import { useAppContext } from "./context/AppContext";
import VoucherCard from "./components/user/item/VoucherCard";
import Vouchers from "./components/seller/Vouchers";
import TokenTester from './components/TokenTester';
import Chatbot from './components/user/Chatbot'; 
import SupportChat from './components/user/SupportChat';
import SupportChatSeller from './components/seller/SupportChatSeller';
import { useSelector } from 'react-redux'; 
import UserList from "./components/seller/UserList";
import Ratings from "./components/seller/Ratings";
import BlogPage from './pages/user/BlogPage';
import BlogPostPage from './pages/user/BlogPostPage';
import SellerBlogPage from './pages/seller/SellerBlogPage';
import OrderDetail from "./components/seller/OrderDetail";
import GoogleAuthCallback from './pages/user/GoogleAuthCallback';
import CategoryManagement from "./components/seller/CategoryManagement";
const App = () => {
  const isSellerPath = useLocation().pathname.includes("seller");
  const { showUserLogin } = useAppContext();
  
  const { isAuthenticated, isSeller } = useSelector(state => state.auth);

  const SellerRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login?mode=seller" replace />;
    }
    
    if (!isSeller) {
      return <Navigate to="/login?mode=seller" replace />;
    }
    
    return children;
  };

  return (
    <div>
      {isSellerPath ? null : <Navbar />}

      <Toaster 
        position="bottom-right"
        expand={true}
        richColors
        closeButton
        toastOptions={{
          style: {
            color: '#1f2937',
            fontSize: '14px',
            fontWeight: '500',
          },
          className: 'toast-custom',
          duration: 4000,
        }}
      />
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/user" element={<Dashboard />}>
          <Route index element={<Dashboard />} />
          <Route path="notifications" element={<Dashboard />} />
          <Route path="account" element={<Dashboard />} />
          <Route path="account/profile" element={<Dashboard />} />
          <Route path="wishlist" element={<Dashboard />} />
          <Route path="recent" element={<Dashboard />} />
          <Route path="orders" element={<Dashboard />} />
          <Route path="orders/:orderId" element={<Dashboard />} /> 
        </Route>
        
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/forgot-password/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/forgot-password/reset" element={<NewPasswordPage />} />
        
        <Route path="/change-password" element={<ForgotPasswordPage />} />
        <Route path="/change-password/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/change-password/reset" element={<NewPasswordPage />} />
       
        <Route path="/upload-to-cloudinary" element={<UploadImages />} />
        
        <Route path="/token-tester" element={<TokenTester />} />        
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products" element={<AllProducts />} />

        <Route path="/my-profile" element={<ProfilePage />} />
        <Route path="/voucher-list" element={<VoucherCard />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/auth/google/success" element={<GoogleAuthCallback />} />
        
        <Route path="/seller" element={
          <SellerRoute>
            <SellerLayout />
          </SellerRoute>
        }>
          <Route path="/seller/blog" element={<SellerBlogPage />} />
          <Route index element={<DashboardSeller />} />
          <Route path="products" element={<ProductList />} />
          <Route path="orders" element={<Orders />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="/seller/orders/:orderId" element={<OrderDetail/>} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="my-account" element={<MyAccount />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="manage-user" element={<UserList />} />
          <Route path="support" element={<SupportChatSeller />} />
          <Route path="ratings" element={<Ratings />} />
        </Route>
      </Routes>
      
      {!isSellerPath && <Footer />}
      {!isSellerPath && <SupportChat />}
      {!isSellerPath && <Chatbot />}
    </div>
  );
};

export default App;