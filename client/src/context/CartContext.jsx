import React, { createContext, useContext, useEffect, useState } from "react";
import cartService from "@/services/cartService";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load giỏ hàng từ API
  const loadCart = async () => {
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

  const addToCart = async (product_id, quantity = 1) => {
    try {
      const res = await cartService.addToCart(product_id, quantity);
      if (res.success) {
        setItems((prev) => {
          const exist = prev.find((item) => item._id === res.data._id);
          if (exist) {
            // Cộng dồn quantity nếu đã có
            return prev.map((item) =>
              item._id === res.data._id
                ? { ...item, quantity: res.data.quantity }
                : item
            );
          }
          // Nếu chưa có, thêm vào mảng
          return [...prev, res.data];
        });
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  // Cập nhật số lượng
  const updateQuantity = async (cartItem_id, quantity) => {
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
    try {
      const res = await cartService.clearCart();
      if (res.success) {
        setItems([]);
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => useContext(CartContext);
