import React from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import LoginPage from "./pages/user/LoginPage";
import RegisterPage from "./pages/user/RegisterPage";
import Dashboard from "./pages/user/Dashboard";
import HomePage from "./pages/user/HomePage";
import { Route, Routes, useLocation } from "react-router";
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
import SellerLogin from "./pages/seller/SellerLogin";
import SellerLayout from "./components/seller/SellerLayout";
import ProductList from "./components/seller/ProductList";
import Orders from "./components/seller/Orders";
import Notifications from "./components/seller/SellerNotificationBell";
import MyAccount from "./components/seller/MyAccount";
import DashboardSeller from "./components/seller/DashboardSeller";
import { useAppContext } from "./context/AppContext";
import VoucherCard from "./components/user/item/VoucherCard";
import Vouchers from "./components/seller/Vouchers";
import TokenTester from './components/TokenTester';
import Chatbot from './components/user/Chatbot'; 
import SupportChat from './components/user/SupportChat';
import SupportChatSeller from './components/seller/SupportChatSeller';
const App = () => {
  const isSellerPath = useLocation().pathname.includes("seller");
  const { showUserLogin, isSeller } = useAppContext();
  return (
    <div>
      {isSellerPath ? null : <Navbar />}

      <Toaster />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/reset-password" element={<NewPasswordPage />} />
        <Route path="/upload-to-cloudinary" element={<UploadImages />} />

        <Route path="/token-tester" element={<TokenTester />} />

        <Route path="/cart" element={<CartPage />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/my-profile" element={<ProfilePage />} />
        <Route path="/voucher-list" element={<VoucherCard />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route
          path="/seller"
          element={isSeller ? <SellerLayout /> : <SellerLogin />}
        >
          <Route index element={isSeller ? <DashboardSeller /> : null} />
          <Route path="products" element={<ProductList />} />
          <Route path="orders" element={<Orders />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="my-account" element={<MyAccount />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="support" element={<SupportChatSeller />} />
        </Route>
      </Routes>
      {!isSellerPath && <Footer />}
      {!isSellerPath && <SupportChat />}
      {!isSellerPath && <Chatbot />}
    </div>
  );
};
export default App;
