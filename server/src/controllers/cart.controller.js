import CartItem from "../models/cart.model.js";
import Product from "../models/product.model.js";

// 1. Lấy giỏ hàng của user
export const getCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cartItems = await CartItem.find({ user_id: userId })
      .populate("product_id", "name price sale_price images")
      .sort({ updated_at: -1 }); // sản phẩm vừa thêm hoặc update lên đầu

    res.json({
      success: true,
      data: cartItems,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Thêm sản phẩm vào giỏ
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { product_id, quantity } = req.body;
    console.log("User ID:", userId);
    console.log("Product found:", product_id);
    // Kiểm tra product có tồn tại không
    const product = await Product.findById(product_id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Kiểm tra đã có trong giỏ chưa
    let cartItem = await CartItem.findOne({ user_id: userId, product_id });

    if (cartItem) {
      cartItem.quantity += quantity || 1;
    } else {
      cartItem = new CartItem({
        user_id: userId,
        product_id,
        quantity: quantity || 1,
      });
    }

    await cartItem.save();
    cartItem = await cartItem.populate(
      "product_id",
      "name price sale_price images"
    );
    res.json({ success: true, data: cartItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Cập nhật số lượng (theo cartItem _id)
export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params; // cartItem _id
    const { quantity } = req.body;

    const cartItem = await CartItem.findById(id);
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    if (quantity <= 0) {
      await cartItem.deleteOne();
      return res.json({ success: true, message: "Item removed" });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    res.json({ success: true, data: cartItem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Xóa 1 sản phẩm khỏi giỏ (theo cartItem _id)
export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params; // cartItem _id

    const cartItem = await CartItem.findByIdAndDelete(id);
    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found" });
    }

    res.json({ success: true, message: "Item removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Xóa toàn bộ giỏ vẫn dựa vào user_id
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.userId;
    await CartItem.deleteMany({ user_id: userId });

    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const removeMultipleItems = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemIds } = req.body;

    // Validate input
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "itemIds must be a non-empty array",
      });
    }

    console.log('🗑️ Removing multiple items:', {
      userId,
      itemIds,
      count: itemIds.length
    });

    // Xóa các items thuộc về user và có _id trong danh sách
    const result = await CartItem.deleteMany({
      user_id: userId,
      _id: { $in: itemIds },
    });

    console.log('✅ Delete result:', {
      deletedCount: result.deletedCount,
      acknowledged: result.acknowledged
    });

    // Lấy lại giỏ hàng còn lại
    const remainingItems = await CartItem.find({ user_id: userId })
      .populate("product_id", "name price sale_price images")
      .sort({ updated_at: -1 });

    res.json({
      success: true,
      message: `${result.deletedCount} items removed successfully`,
      data: {
        deletedCount: result.deletedCount,
        items: remainingItems,
      },
    });
  } catch (err) {
    console.error('❌ Remove multiple items error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};