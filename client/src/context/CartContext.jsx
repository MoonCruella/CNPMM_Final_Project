import React, { createContext, useContext, useEffect, useState } from "react";
import cartService from "@/services/cartService";
import { useSelector } from "react-redux"; // Thay đổi: sử dụng Redux thay vì AppContext

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // Lấy user từ Redux store
  const { user, isAuthenticated } = useSelector(state => state.auth);
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load giỏ hàng từ API (chỉ khi đã login)
  const loadCart = async () => {
    if (!isAuthenticated || !user) {
      setItems([]); // nếu chưa login hoặc logout thì giỏ rỗng
      return;
    }
    
    try {
      setLoading(true);
      const res = await cartService.getCart();
      if (res.success) {
        setItems(res.data); // set state từ backend
      }
    } catch (err) {
      console.error("Error loading cart:", err);
    } finally {
      setLoading(false);
    }
  };

  // Thêm sản phẩm
  const addToCart = async (product_id, quantity = 1) => {
    
    if (!isAuthenticated || !user) return; 
    
    try {
      const res = await cartService.addToCart(product_id, quantity);
      if (res.success) {
        setItems((prev) => {
          const exist = prev.find((item) => item._id === res.data._id);
          if (exist) {
            return prev.map((item) =>
              item._id === res.data._id
                ? { ...item, quantity: res.data.quantity }
                : item
            );
          }
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  // Cập nhật số lượng
  const updateQuantity = async (cartItem_id, quantity) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const res = await cartService.updateCartItem(cartItem_id, quantity);
      if (res.success) {
        setItems((prev) =>
          prev.map((item) =>
            item._id === cartItem_id
              ? { ...item, quantity: res.data.quantity }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error updating cart:", err);
    }
  };

  // Xóa sản phẩm
  const removeFromCart = async (cartItem_id) => {
    if (!isAuthenticated || !user) return;
    
    try {
      const res = await cartService.removeFromCart(cartItem_id);
      if (res.success) {
        setItems((prev) => prev.filter((item) => item._id !== cartItem_id));
      }
    } catch (err) {
      console.error("Error removing cart item:", err);
    }
  };

  // Xóa toàn bộ giỏ
  const clearCart = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const res = await cartService.clearCart();
      if (res.success) {
        setItems([]);
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  // Thêm debug log để theo dõi Redux state
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('CartContext: Redux auth state:', {
        isAuthenticated,
        userId: user?._id
      });
    }
  }, [isAuthenticated, user]);

  // 🔑 Load lại giỏ mỗi khi user thay đổi (login/logout)
  useEffect(() => {
    loadCart();
  }, [isAuthenticated, user?._id]); // Sửa dependency để theo dõi cả isAuthenticated và user ID

  const refreshCart = async () => {
    await loadCart();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        loadCart,
        refreshCart,
        isAuthenticated, // Export thêm trạng thái xác thực
        hasUser: !!user, // Tiện ích để kiểm tra có user hay không
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => useContext(CartContext);