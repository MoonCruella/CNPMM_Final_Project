import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import cartService from "@/services/cartService";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]); //  Main state
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  //  UNIFIED loadCart function - Update items state
  const loadCart = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setItems([]);
      setSelectedItems([]);
      setIsLoading(false);
      return null;
    }
    
    try {
      setLoading(true);
      setIsLoading(true);
      
      const res = await cartService.getCart();
      
      if (res.success) {
        const cartData = res.data || [];
        setItems(cartData); 
        return cartData;
      } else {
        console.warn("⚠️ Cart load failed");
        setItems([]);
        return [];
      }
    } catch (err) {
      console.error("❌ Error loading cart:", err);
      setItems([]);
      return [];
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  //  fetchCart is now just an alias for loadCart
  const fetchCart = loadCart;

  //  Initial load
  useEffect(() => {
    loadCart();
  }, [loadCart]);

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
        
        // Auto select new item
        const newItem = res.data;
        if (newItem && !selectedItems.includes(newItem._id)) {
          setSelectedItems(prev => [...prev, newItem._id]);
        }
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error('Không thể thêm vào giỏ hàng');
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
      toast.error('Không thể cập nhật số lượng');
    }
  };

  // Xóa sản phẩm
  const removeFromCart = async (itemId) => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      
      const response = await cartService.removeFromCart(itemId);
      
      if (response.success) {
        //  Update local state immediately
        setItems(prev => prev.filter(item => item._id !== itemId));
        setSelectedItems(prev => prev.filter(id => id !== itemId));
        
        toast.success('Đã xóa khỏi giỏ hàng');
        
        //  Reload to ensure sync
        await loadCart();
      } else {
        toast.error(response.message || 'Không thể xóa sản phẩm');
        await loadCart();
      }
    } catch (error) {
      console.error('❌ Remove from cart error:', error);
      
      // Only show error if not success
      if (error.response?.status !== 200) {
        toast.error('Có lỗi xảy ra');
      }
      
      await loadCart();
    } finally {
      setLoading(false);
    }
  };

  // Xóa nhiều items
  const removeMultipleItems = async (itemIds) => {
    if (!isAuthenticated || !user) return;
    if (!Array.isArray(itemIds) || itemIds.length === 0) return;
    
    try {
      setLoading(true);
      
      const response = await cartService.removeMultipleItems(itemIds);
      
      if (response.success) {
        // Update local state
        setItems(prev => prev.filter(item => !itemIds.includes(item._id)));
        setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)));
        
        toast.success(`Đã xóa ${itemIds.length} sản phẩm khỏi giỏ hàng`);
        
        // Reload to sync
        await loadCart();
      } else {
        console.error('❌ Remove multiple items failed');
        toast.error('Không thể cập nhật giỏ hàng');
        await loadCart();
      }
    } catch (error) {
      console.error('❌ Remove multiple items error:', error);
      toast.error('Có lỗi xảy ra');
      await loadCart();
    } finally {
      setLoading(false);
    }
  };

  // Xóa toàn bộ giỏ
  const clearCart = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      console.warn('⚠️ clearCart() called');
      const res = await cartService.clearCart();
      if (res.success) {
        setItems([]);
        setSelectedItems([]);
        toast.success('Đã xóa toàn bộ giỏ hàng');
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
      toast.error('Không thể xóa giỏ hàng');
    }
  };

  // Toggle single item selection
  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Select all items
  const selectAllItems = () => {
    setSelectedItems(items.map(item => item._id));
  };

  // Deselect all items
  const deselectAllItems = () => {
    setSelectedItems([]);
  };

  // Check if all items are selected
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;

  // Get selected items details
  const getSelectedItems = () => {
    return items.filter(item => selectedItems.includes(item._id));
  };

  // Calculate selected items total
  const getSelectedTotal = () => {
    return getSelectedItems().reduce((total, item) => {
      const price = Number(item.product_id?.sale_price || item.product_id?.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return total + (price * quantity);
    }, 0);
  };

  const refreshCart = loadCart; 

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        isLoading, 
        addToCart,
        updateQuantity,
        removeFromCart,
        removeMultipleItems, 
        fetchCart,
        clearCart,
        loadCart,
        refreshCart,
        isAuthenticated,
        hasUser: !!user,
        selectedItems,
        toggleSelectItem,
        selectAllItems,
        deselectAllItems,
        isAllSelected,
        getSelectedItems,
        getSelectedTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => useContext(CartContext);