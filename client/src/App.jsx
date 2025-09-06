import React from "react";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import { Route, Routes, useLocation } from "react-router";
import { Toaster } from "./components/ui/sonner";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import VerifyOTPPage from "./pages/VerifyOTPPage";
import NewPasswordPage from "./pages/NewPasswordPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import UploadImages from "./components/UploadImages";
import CartPage from "./pages/CartPage";
import AllProducts from "./pages/AllProducts";
import MyOrdersPage from "./pages/MyOrderPage";
import CheckoutPage from "./pages/CheckoutPage";
import AddressForm from "./components/AddressForm";

const App = () => {
  const isSellerPath = useLocation().pathname.includes("seller");
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

        <Route path="/cart" element={<CartPage />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="//my-orders" element={<MyOrdersPage />} />
        <Route path="/my-profile" element={<ProfilePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
      {isSellerPath ? null : <Footer />}
    </div>
  );
};
export default App;
